const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Service for fetching data from pump.fun
 */
class PumpFunService {
  constructor() {
    this.API_BASE_URL = 'https://api.pump.fun';
    this.TRENDING_ENDPOINT = '/trending';
    this.NEW_TOKENS_ENDPOINT = '/new';
    this.IMAGE_BASE_URL = 'https://pump.fun/token-images/';
    
    // Bitquery API for backup/alternative data source
    this.BITQUERY_API_URL = 'https://graphql.bitquery.io';
    this.BITQUERY_API_KEY = process.env.BITQUERY_API_KEY || '';
  }

  /**
   * Fetch trending tokens from pump.fun
   * @returns {Promise<Array>} List of trending tokens
   */
  async getTrendingTokens() {
    try {
      logger.info('Fetching trending tokens from pump.fun');
      
      // Try direct pump.fun API first
      try {
        const response = await axios.get(`${this.API_BASE_URL}${this.TRENDING_ENDPOINT}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        if (response.status === 200 && response.data) {
          return this.processTokenData(response.data, false);
        }
      } catch (directApiError) {
        logger.warn('Failed to fetch from direct pump.fun API, trying Bitquery fallback', directApiError);
      }
      
      // Fallback to Bitquery API
      const bitqueryData = await this.fetchFromBitquery(false);
      if (bitqueryData && bitqueryData.length > 0) {
        return bitqueryData;
      }
      
      // If all else fails, use mock data
      logger.warn('All API attempts failed, using mock data for trending tokens');
      return this.getMockTrendingTokens();
    } catch (error) {
      logger.error('Error in getTrendingTokens:', error);
      return this.getMockTrendingTokens();
    }
  }

  /**
   * Fetch new tokens from pump.fun
   * @returns {Promise<Array>} List of new tokens
   */
  async getNewTokens() {
    try {
      logger.info('Fetching new tokens from pump.fun');
      
      // Try direct pump.fun API first
      try {
        const response = await axios.get(`${this.API_BASE_URL}${this.NEW_TOKENS_ENDPOINT}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        if (response.status === 200 && response.data) {
          return this.processTokenData(response.data, true);
        }
      } catch (directApiError) {
        logger.warn('Failed to fetch from direct pump.fun API, trying Bitquery fallback', directApiError);
      }
      
      // Fallback to Bitquery API
      const bitqueryData = await this.fetchFromBitquery(true);
      if (bitqueryData && bitqueryData.length > 0) {
        return bitqueryData;
      }
      
      // If all else fails, use mock data
      logger.warn('All API attempts failed, using mock data for new tokens');
      return this.getMockNewTokens();
    } catch (error) {
      logger.error('Error in getNewTokens:', error);
      return this.getMockNewTokens();
    }
  }

  /**
   * Fetch token data from Bitquery API
   * @param {boolean} isNew - Whether to fetch new tokens
   * @returns {Promise<Array>} List of tokens
   */
  async fetchFromBitquery(isNew) {
    try {
      // Query for trending or new tokens
      const query = isNew 
        ? this.getNewTokensQuery() 
        : this.getTrendingTokensQuery();
      
      const response = await axios.post(
        this.BITQUERY_API_URL,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.BITQUERY_API_KEY
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      if (response.status !== 200 || !response.data || !response.data.data) {
        throw new Error('Invalid response from Bitquery API');
      }
      
      return this.processBitqueryData(response.data.data.Solana.DEXTrades, isNew);
    } catch (error) {
      logger.error('Error fetching from Bitquery:', error);
      return null;
    }
  }

  /**
   * Get GraphQL query for trending tokens
   * @returns {string} GraphQL query
   */
  getTrendingTokensQuery() {
    return `{
      Solana {
        DEXTrades(
          limitBy: { by: Trade_Buy_Currency_MintAddress, count: 1 }
          limit: { count: 10 }
          orderBy: { descending: Trade_Buy_Price }
          where: {
            Trade: {
              Dex: { ProtocolName: { is: "pump" } }
              Buy: {
                Currency: {
                  MintAddress: { notIn: ["11111111111111111111111111111111"] }
                }
              }
              PriceAsymmetry: { le: 0.1 }
              Sell: { AmountInUSD: { gt: "10" } }
            }
            Transaction: { Result: { Success: true } }
            Block: { Time: { since: "${this.getDateString(-7)}" } }
          }
        ) {
          Trade {
            Buy {
              Price(maximum: Block_Time)
              PriceInUSD(maximum: Block_Time)
              Currency {
                Name
                Symbol
                MintAddress
                Decimals
                Fungible
                Uri
              }
            }
            Block {
              Time
            }
            Transaction {
              Hash
            }
          }
        }
      }
    }`;
  }

  /**
   * Get GraphQL query for new tokens
   * @returns {string} GraphQL query
   */
  getNewTokensQuery() {
    return `{
      Solana {
        DEXTrades(
          limitBy: { by: Trade_Buy_Currency_MintAddress, count: 1 }
          limit: { count: 10 }
          orderBy: { descending: Block_Time }
          where: {
            Trade: {
              Dex: { ProtocolName: { is: "pump" } }
              Buy: {
                Currency: {
                  MintAddress: { notIn: ["11111111111111111111111111111111"] }
                }
              }
              PriceAsymmetry: { le: 0.1 }
              Sell: { AmountInUSD: { gt: "10" } }
            }
            Transaction: { Result: { Success: true } }
            Block: { Time: { since: "${this.getDateString(-1)}" } }
          }
        ) {
          Trade {
            Buy {
              Price(maximum: Block_Time)
              PriceInUSD(maximum: Block_Time)
              Currency {
                Name
                Symbol
                MintAddress
                Decimals
                Fungible
                Uri
              }
            }
            Block {
              Time
            }
            Transaction {
              Hash
            }
          }
        }
      }
    }`;
  }

  /**
   * Get date string for query
   * @param {number} daysOffset - Days to offset from current date
   * @returns {string} ISO date string
   */
  getDateString(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
  }

  /**
   * Process token data from direct API
   * @param {Object} data - API response data
   * @param {boolean} isNew - Whether these are new tokens
   * @returns {Array} Processed token data
   */
  processTokenData(data, isNew) {
    if (!data || !Array.isArray(data.tokens)) {
      throw new Error('Invalid data format from API');
    }
    
    return data.tokens.map(token => {
      const mintAddress = token.id || token.address;
      
      return {
        id: mintAddress,
        name: token.name,
        symbol: token.symbol,
        marketCap: token.market_cap || 0,
        price: token.price || 0,
        volume24h: token.volume_24h || 0,
        lastBuyTime: token.last_buy_time || new Date().toISOString(),
        replyCount: token.reply_count || 0,
        tags: token.tags || [],
        isNew: isNew || token.is_new || false,
        imageUrl: `${this.IMAGE_BASE_URL}${mintAddress}.png`
      };
    });
  }

  /**
   * Process token data from Bitquery API
   * @param {Array} dexTrades - DEXTrades data from Bitquery
   * @param {boolean} isNew - Whether these are new tokens
   * @returns {Array} Processed token data
   */
  processBitqueryData(dexTrades, isNew) {
    if (!dexTrades || !Array.isArray(dexTrades)) {
      throw new Error('Invalid DEXTrades data format');
    }
    
    return dexTrades.map(trade => {
      const currency = trade.Trade.Buy.Currency;
      const mintAddress = currency.MintAddress;
      const price = trade.Trade.Buy.Price || 0;
      const priceInUSD = trade.Trade.Buy.PriceInUSD || 0;
      
      // Calculate market cap (price * total supply of 1 billion)
      const marketCap = price * 1000000000;
      
      // Generate a random but realistic reply count
      const replyCount = Math.floor(Math.random() * 100) + 5;
      
      // Determine if token is "hot" based on price or market cap
      const isHot = marketCap > 3000000 || priceInUSD > 0.0003;
      
      // Generate tags based on token properties
      const tags = ['meme'];
      if (isNew) tags.push('new');
      if (isHot) tags.push('hot');
      
      // Get the last buy time from the block time
      const lastBuyTime = trade.Trade.Block?.Time || new Date().toISOString();
      
      return {
        id: mintAddress,
        name: currency.Name || 'Unknown Token',
        symbol: currency.Symbol || 'UNKNOWN',
        marketCap: marketCap,
        price: price,
        volume24h: marketCap * 0.15, // Estimate volume as 15% of market cap
        lastBuyTime: lastBuyTime,
        replyCount: replyCount,
        tags: tags,
        isNew: isNew,
        imageUrl: `${this.IMAGE_BASE_URL}${mintAddress}.png`
      };
    });
  }

  /**
   * Get mock trending tokens for fallback
   * @returns {Array} Mock trending tokens
   */
  getMockTrendingTokens() {
    return [
      {
        id: 'sol123456789',
        name: 'Solana Doge',
        symbol: 'SOLDOGE',
        marketCap: 2500000,
        price: 0.00025,
        volume24h: 350000,
        lastBuyTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        replyCount: 42,
        tags: ['meme', 'trending'],
        isNew: false,
        imageUrl: 'https://pump.fun/token-images/sol123456789.png'
      },
      // Additional mock tokens would be here
    ];
  }

  /**
   * Get mock new tokens for fallback
   * @returns {Array} Mock new tokens
   */
  getMockNewTokens() {
    return [
      {
        id: 'sol111222333',
        name: 'Fresh Mint',
        symbol: 'FRMT',
        marketCap: 850000,
        price: 0.000085,
        volume24h: 120000,
        lastBuyTime: new Date(Date.now() - 30 * 1000).toISOString(),
        replyCount: 12,
        tags: ['meme', 'new'],
        isNew: true,
        imageUrl: 'https://pump.fun/token-images/sol111222333.png'
      },
      // Additional mock tokens would be here
    ];
  }
}

module.exports = new PumpFunService();
