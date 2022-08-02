/* eslint-disable global-require */
const _ = require('lodash');

describe('common.js', () => {
  let commonHelper;

  let cacheMock;
  let binanceMock;
  let mongoMock;
  let PubSubMock;
  let slackMock;
  let loggerMock;

  let mockConfigGet;

  let mockJWTVerify;

  let result;

  beforeEach(() => {
    jest.clearAllMocks().resetModules();
  });

  describe('cacheExchangeSymbols', () => {
    describe('when there is no cached exchange info and no cached exchange info', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest.fn().mockResolvedValue(null);
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.exchangeInfo = jest
          .fn()
          .mockResolvedValue(
            _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
          );

        commonHelper = require('../common');
        await commonHelper.cacheExchangeSymbols(logger, {});
      });

      it('triggers cache.hget for exchange symbols', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('triggers cache.hget for exchange info', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info'
        );
      });

      it('triggers binance exchange info', () => {
        expect(binanceMock.client.exchangeInfo).toHaveBeenCalled();
      });

      it('triggers cache.hset for exchange info', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info',
          JSON.stringify(
            _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
          ),
          3600
        );
      });

      it('triggers cache.hset for exchange symbols', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols',
          JSON.stringify(
            require('./fixtures/binance-cached-exchange-symbols.json')
          ),
          3600
        );
      });
    });

    describe('when there is cached exchange info', () => {
      describe('when cached exchange symbol is not valid', () => {
        beforeEach(async () => {
          const { cache, binance, logger } = require('../../../helpers');

          cacheMock = cache;
          binanceMock = binance;

          cacheMock.hget = jest.fn().mockImplementation((hash, key) => {
            if (
              hash === 'trailing-trade-common' &&
              key === 'exchange-symbols'
            ) {
              return JSON.stringify(
                require('./fixtures/binance-cached-not-valid-exchange-symbols.json')
              );
            }
            if (hash === 'trailing-trade-common' && key === 'exchange-info') {
              return JSON.stringify(
                _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
              );
            }

            return null;
          });
          cacheMock.hset = jest.fn().mockResolvedValue(true);

          binanceMock.client.exchangeInfo = jest.fn().mockResolvedValue(null);

          commonHelper = require('../common');
          await commonHelper.cacheExchangeSymbols(logger, {
            supportFIATs: ['USDT', 'BUSD']
          });
        });

        it('triggers cache.hget for exchange symbols', () => {
          expect(cacheMock.hget).toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-symbols'
          );
        });

        it('triggers cache.hget for exchange info', () => {
          expect(cacheMock.hget).toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-info'
          );
        });

        it('does not trigger binance exchange info', () => {
          expect(binanceMock.client.exchangeInfo).not.toHaveBeenCalled();
        });

        it('does not trigger cache.hset for exchange info', () => {
          expect(cacheMock.hset).not.toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-info',
            JSON.stringify(
              _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
            ),
            3600
          );
        });

        it('triggers cache.hset for exchange symbols', () => {
          expect(cacheMock.hset).toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-symbols',
            JSON.stringify(
              require('./fixtures/binance-cached-exchange-symbols.json')
            ),
            3600
          );
        });
      });

      describe('when cached exchange symbol is valid', () => {
        beforeEach(async () => {
          const { cache, binance, logger } = require('../../../helpers');

          cacheMock = cache;
          binanceMock = binance;

          cacheMock.hget = jest.fn().mockImplementation((hash, key) => {
            if (
              hash === 'trailing-trade-common' &&
              key === 'exchange-symbols'
            ) {
              return JSON.stringify(
                require('./fixtures/binance-cached-exchange-symbols.json')
              );
            }
            if (hash === 'trailing-trade-common' && key === 'exchange-info') {
              return JSON.stringify(
                _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
              );
            }

            return null;
          });
          cacheMock.hset = jest.fn().mockResolvedValue(true);

          binanceMock.client.exchangeInfo = jest.fn().mockResolvedValue(null);

          commonHelper = require('../common');
          await commonHelper.cacheExchangeSymbols(logger, {
            supportFIATs: ['USDT', 'BUSD']
          });
        });

        it('triggers cache.hget for exchange symbols', () => {
          expect(cacheMock.hget).toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-symbols'
          );
        });

        it('does not trigger cache.hget for exchange info', () => {
          expect(cacheMock.hget).not.toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-info'
          );
        });

        it('does not trigger binance exchange info', () => {
          expect(binanceMock.client.exchangeInfo).not.toHaveBeenCalled();
        });

        it('does not trigger cache.hset for exchange info', () => {
          expect(cacheMock.hset).not.toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-info',
            JSON.stringify(
              _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
            ),
            3600
          );
        });

        it('does not trigger cache.hset for exchange symbols', () => {
          expect(cacheMock.hset).not.toHaveBeenCalledWith(
            'trailing-trade-common',
            'exchange-symbols',
            JSON.stringify(
              require('./fixtures/binance-cached-exchange-symbols.json')
            ),
            3600
          );
        });
      });
    });

    describe('when there is no cached exchange info but has cached exchange info', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest.fn().mockImplementation((hash, key) => {
          if (hash === 'trailing-trade-common' && key === 'exchange-info') {
            return JSON.stringify(
              _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
            );
          }

          return null;
        });

        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.exchangeInfo = jest
          .fn()
          .mockResolvedValue(
            _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
          );

        commonHelper = require('../common');
        await commonHelper.cacheExchangeSymbols(logger, {
          supportFIATs: ['USDT', 'BUSD']
        });
      });

      it('triggers cache.hget for exchange symbols', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('triggers cache.hget for exchange info', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info'
        );
      });

      it('does not trigger binance exchange info', () => {
        expect(binanceMock.client.exchangeInfo).not.toHaveBeenCalled();
      });

      it('does not triggers cache.hset for exchange info', () => {
        expect(cacheMock.hset).not.toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info',
          JSON.stringify(
            _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
          ),
          3600
        );
      });

      it('triggers cache.hset for exchange symbols', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols',
          JSON.stringify(
            require('./fixtures/binance-cached-exchange-symbols.json')
          ),
          3600
        );
      });
    });
  });

  describe('extendBalancesWithDustTransfer', () => {
    beforeEach(async () => {
      const { cache, binance, logger } = require('../../../helpers');

      cacheMock = cache;
      binanceMock = binance;

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      cacheMock.hget = jest.fn().mockImplementation((hash, key) => {
        if (
          hash === 'trailing-trade-symbols' &&
          key === 'ETHBTC-latest-candle'
        ) {
          return JSON.stringify({ close: '0.065840' });
        }

        if (
          hash === 'trailing-trade-symbols' &&
          key === 'LTCBTC-latest-candle'
        ) {
          return JSON.stringify({ close: '0.04480' });
        }

        if (
          hash === 'trailing-trade-symbols' &&
          key === 'TRXBTC-latest-candle'
        ) {
          return JSON.stringify({ close: '0.00000179' });
        }

        return null;
      });

      commonHelper = require('../common');
      result = await commonHelper.extendBalancesWithDustTransfer(logger, {
        balances: [
          {
            asset: 'BTC',
            free: '0.001'
          },
          {
            asset: 'BNB',
            free: '0.02'
          },
          {
            asset: 'ETH',
            free: '1'
          },
          {
            asset: 'LTC',
            free: '0.001'
          },
          {
            asset: 'TRX',
            free: '0.001'
          },
          {
            asset: 'XRP',
            free: '2'
          }
        ]
      });
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual({
        balances: [
          {
            asset: 'BTC',
            canDustTransfer: false,
            estimatedBTC: -1,
            free: '0.001'
          },
          {
            asset: 'BNB',
            canDustTransfer: false,
            estimatedBTC: -1,
            free: '0.02'
          },
          {
            asset: 'ETH',
            canDustTransfer: false,
            estimatedBTC: '0.06584000',
            free: '1'
          },
          {
            asset: 'LTC',
            canDustTransfer: true,
            estimatedBTC: '0.00004480',
            free: '0.001'
          },
          {
            asset: 'TRX',
            canDustTransfer: true,
            estimatedBTC: '0.00000000',
            free: '0.001'
          },
          {
            asset: 'XRP',
            canDustTransfer: false,
            estimatedBTC: -1,
            free: '2'
          }
        ]
      });
    });
  });

  describe('getAccountInfoFromAPI', () => {
    beforeEach(async () => {
      const { cache, binance, logger } = require('../../../helpers');

      cacheMock = cache;
      binanceMock = binance;

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      binanceMock.client.accountInfo = jest
        .fn()
        .mockResolvedValue(require('./fixtures/binance-account-info.json'));

      commonHelper = require('../common');
      result = await commonHelper.getAccountInfoFromAPI(logger);
    });

    it('triggers binance account info', () => {
      expect(binanceMock.client.accountInfo).toHaveBeenCalled();
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledWith(
        'trailing-trade-common',
        'account-info',
        JSON.stringify(require('./fixtures/binance-cached-account-info.json'))
      );
    });

    it('returns expected value', () => {
      expect(result).toStrictEqual(
        require('./fixtures/binance-cached-account-info.json')
      );
    });
  });

  describe('getCachedExchangeSymbols', () => {
    describe('when exchange symbols is not null', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;

        cacheMock.hget = jest
          .fn()
          .mockResolvedValue(
            JSON.stringify(
              require('./fixtures/binance-cached-exchange-symbols.json')
            )
          );

        commonHelper = require('../common');
        result = await commonHelper.getCachedExchangeSymbols(logger);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(
          require('./fixtures/binance-cached-exchange-symbols.json')
        );
      });
    });
    describe('when exchange symbols is null', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getCachedExchangeSymbols(logger);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual({});
      });
    });
  });

  describe('getCachedExchangeInfo', () => {
    describe('when exchange info is not null', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;

        cacheMock.hget = jest
          .fn()
          .mockResolvedValue(
            JSON.stringify(require('./fixtures/binance-exchange-info.json'))
          );

        commonHelper = require('../common');
        result = await commonHelper.getCachedExchangeInfo(logger);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(
          require('./fixtures/binance-exchange-info.json')
        );
      });
    });
    describe('when exchange info is null', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getCachedExchangeSymbols(logger);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual({});
      });
    });
  });

  describe('getAccountInfo', () => {
    describe('when there is cached account information', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hgetWithoutLock = jest
          .fn()
          .mockResolvedValue(
            JSON.stringify(
              require('./fixtures/binance-cached-account-info.json')
            )
          );
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.accountInfo = jest
          .fn()
          .mockResolvedValue(require('./fixtures/binance-account-info.json'));

        commonHelper = require('../common');
        result = await commonHelper.getAccountInfo(logger);
      });

      it('triggers cache.hgetWithoutLock for account info', () => {
        expect(cacheMock.hgetWithoutLock).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info'
        );
      });

      it('does not trigger binance account info', () => {
        expect(binanceMock.client.accountInfo).not.toHaveBeenCalled();
      });

      it('does not trigger cache.hset', () => {
        expect(cacheMock.hset).not.toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info',
          JSON.stringify(require('./fixtures/binance-cached-account-info.json'))
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(
          require('./fixtures/binance-cached-account-info.json')
        );
      });
    });

    describe('when there is no cached account information', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hgetWithoutLock = jest.fn().mockResolvedValue(null);
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.accountInfo = jest
          .fn()
          .mockResolvedValue(require('./fixtures/binance-account-info.json'));

        commonHelper = require('../common');
        result = await commonHelper.getAccountInfo(logger);
      });

      it('triggers cache.hgetWithoutLock for account info', () => {
        expect(cacheMock.hgetWithoutLock).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info'
        );
      });

      it('triggers binance account info', () => {
        expect(binanceMock.client.accountInfo).toHaveBeenCalled();
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info',
          JSON.stringify(require('./fixtures/binance-cached-account-info.json'))
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(
          require('./fixtures/binance-cached-account-info.json')
        );
      });
    });
  });

  describe('getOpenOrdersFromAPI', () => {
    beforeEach(async () => {
      const { binance, logger } = require('../../../helpers');

      binanceMock = binance;

      binanceMock.client.openOrders = jest.fn().mockResolvedValue([
        {
          symbol: 'BTCUSDT'
        }
      ]);

      commonHelper = require('../common');
      result = await commonHelper.getOpenOrdersFromAPI(logger);
    });

    it('triggers binance.client.openOrders', () => {
      expect(binanceMock.client.openOrders).toHaveBeenCalledWith({
        recvWindow: 10000
      });
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual([
        {
          symbol: 'BTCUSDT'
        }
      ]);
    });
  });

  describe('getOpenOrdersBySymbolFromAPI', () => {
    beforeEach(async () => {
      const { binance, logger } = require('../../../helpers');

      binanceMock = binance;
      binanceMock.client.openOrders = jest.fn().mockResolvedValue([
        {
          symbol: 'BTCUSDT'
        }
      ]);

      commonHelper = require('../common');
      result = await commonHelper.getOpenOrdersBySymbolFromAPI(
        logger,
        'BTCUSDT'
      );
    });

    it('triggers binance.client.openOrders', () => {
      expect(binanceMock.client.openOrders).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        recvWindow: 10000
      });
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual([{ symbol: 'BTCUSDT' }]);
    });
  });

  describe('getAndCacheOpenOrdersForSymbol', () => {
    beforeEach(async () => {
      const { binance, cache, logger } = require('../../../helpers');

      binanceMock = binance;
      binanceMock.client.openOrders = jest.fn().mockResolvedValue([
        {
          symbol: 'BTCUSDT'
        }
      ]);

      cacheMock = cache;
      loggerMock = logger;

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.getAndCacheOpenOrdersForSymbol(
        logger,
        'BTCUSDT'
      );
    });

    it('triggers binance.client.openOrders', () => {
      expect(binanceMock.client.openOrders).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        recvWindow: 10000
      });
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledWith(
        'trailing-trade-open-orders',
        'BTCUSDT',
        JSON.stringify([
          {
            symbol: 'BTCUSDT'
          }
        ])
      );
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual([{ symbol: 'BTCUSDT' }]);
    });
  });

  describe('getLastBuyPrice', () => {
    describe('when nothing is returned', () => {
      beforeEach(async () => {
        const { mongo, logger } = require('../../../helpers');

        mongoMock = mongo;
        loggerMock = logger;

        mongoMock.findOne = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getLastBuyPrice(loggerMock, 'BTCUSDT');
      });

      it('triggers mongo.findOne', () => {
        expect(mongoMock.findOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          {
            key: 'BTCUSDT-last-buy-price'
          }
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(null);
      });
    });

    describe('when returned last buy price', () => {
      beforeEach(async () => {
        const { mongo, logger } = require('../../../helpers');

        mongoMock = mongo;
        loggerMock = logger;

        mongoMock.findOne = jest.fn().mockResolvedValue({
          lastBuyPrice: 100,
          quantity: 10
        });

        commonHelper = require('../common');
        result = await commonHelper.getLastBuyPrice(loggerMock, 'BTCUSDT');
      });

      it('triggers mongo.findOne', () => {
        expect(mongoMock.findOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          {
            key: 'BTCUSDT-last-buy-price'
          }
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual({
          lastBuyPrice: 100,
          quantity: 10
        });
      });
    });
  });

  describe('saveLastBuyPrice', () => {
    beforeEach(async () => {
      const { cache, mongo, logger } = require('../../../helpers');

      cacheMock = cache;
      mongoMock = mongo;
      loggerMock = logger;

      mongoMock.upsertOne = jest.fn().mockResolvedValue(true);
      cacheMock.hdel = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.saveLastBuyPrice(loggerMock, 'BTCUSDT', {
        lastBuyPrice: 1000,
        quantity: 1
      });
    });

    it('triggers mongo.upsertOne', () => {
      expect(mongoMock.upsertOne).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-symbols',
        { key: 'BTCUSDT-last-buy-price' },
        {
          key: 'BTCUSDT-last-buy-price',
          lastBuyPrice: 1000,
          quantity: 1
        }
      );
    });

    it('triggers cache.hdel', () => {
      expect(cacheMock.hdel).toHaveBeenCalledWith(
        'trailing-trade-configurations',
        'BTCUSDT'
      );
    });

    it('returns expected value', () => {
      expect(result).toBeTruthy();
    });
  });

  describe('removeLastBuyPrice', () => {
    beforeEach(async () => {
      const { cache, mongo, logger } = require('../../../helpers');

      cacheMock = cache;
      mongoMock = mongo;
      loggerMock = logger;

      mongoMock.deleteOne = jest.fn().mockResolvedValue(true);
      cacheMock.hdel = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.removeLastBuyPrice(loggerMock, 'BTCUSDT');
    });

    it('triggers mongo.deleteOne', () => {
      expect(mongoMock.deleteOne).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-symbols',
        { key: 'BTCUSDT-last-buy-price' }
      );
    });

    it('triggers cache.hdel', () => {
      expect(cacheMock.hdel).toHaveBeenCalledWith(
        'trailing-trade-configurations',
        'BTCUSDT'
      );
    });

    it('returns expected value', () => {
      expect(result).toBeTruthy();
    });
  });

  describe('lockSymbol', () => {
    describe('without ttl', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.hset = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        result = await commonHelper.lockSymbol(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'bot-lock',
          'BTCUSDT',
          true,
          5
        );
      });

      it('returns expected value', () => {
        expect(result).toBeTruthy();
      });
    });

    describe('with ttl', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.hset = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        result = await commonHelper.lockSymbol(loggerMock, 'BTCUSDT', 10);
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'bot-lock',
          'BTCUSDT',
          true,
          10
        );
      });

      it('returns expected value', () => {
        expect(result).toBeTruthy();
      });
    });
  });

  describe('isSymbolLocked', () => {
    describe('cache exists', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.hget = jest.fn().mockResolvedValue('true');

        commonHelper = require('../common');
        result = await commonHelper.isSymbolLocked(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith('bot-lock', 'BTCUSDT');
      });

      it('returns expected value', () => {
        expect(result).toBeTruthy();
      });
    });

    describe('cache does not exist', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.isSymbolLocked(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith('bot-lock', 'BTCUSDT');
      });

      it('returns expected value', () => {
        expect(result).toBeFalsy();
      });
    });
  });

  describe('unlockSymbol', () => {
    beforeEach(async () => {
      const { cache, logger } = require('../../../helpers');

      cacheMock = cache;
      loggerMock = logger;

      cacheMock.hdel = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.unlockSymbol(loggerMock, 'BTCUSDT');
    });

    it('triggers cache.hdel', () => {
      expect(cacheMock.hdel).toHaveBeenCalledWith('bot-lock', 'BTCUSDT');
    });

    it('returns expected value', () => {
      expect(result).toBeTruthy();
    });
  });

  describe('disableAction', () => {
    beforeEach(async () => {
      const { cache } = require('../../../helpers');

      cacheMock = cache;

      cacheMock.set = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.disableAction(
        loggerMock,
        'BTCUSDT',
        { some: 'reason' },
        60
      );
    });

    it('triggers cache.set', () => {
      expect(cacheMock.set).toHaveBeenCalledWith(
        'BTCUSDT-disable-action',
        JSON.stringify({ some: 'reason' }),
        60
      );
    });
  });

  describe('isActionDisabled', () => {
    describe('with enabled', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.getWithTTL = jest.fn().mockResolvedValue([
          [null, -2],
          [null, null]
        ]);

        commonHelper = require('../common');
        result = await commonHelper.isActionDisabled('BTCUSDT');
      });

      it('triggers cache.getWithTTL', () => {
        expect(cacheMock.getWithTTL).toHaveBeenCalledWith(
          'BTCUSDT-disable-action'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual({
          isDisabled: false,
          ttl: -2
        });
      });
    });

    describe('with disabled', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.getWithTTL = jest.fn().mockResolvedValue([
          [null, 300],
          [
            null,
            JSON.stringify({
              disabledBy: 'stop loss',
              message: 'Temporary disabled by stop loss',
              canResume: true,
              canRemoveLastBuyPrice: true
            })
          ]
        ]);

        commonHelper = require('../common');
        result = await commonHelper.isActionDisabled('BTCUSDT');
      });

      it('triggers cache.getWithTTL', () => {
        expect(cacheMock.getWithTTL).toHaveBeenCalledWith(
          'BTCUSDT-disable-action'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual({
          isDisabled: true,
          ttl: 300,
          disabledBy: 'stop loss',
          message: 'Temporary disabled by stop loss',
          canResume: true,
          canRemoveLastBuyPrice: true
        });
      });
    });

    describe('when cannot get value', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.getWithTTL = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.isActionDisabled('BTCUSDT');
      });

      it('triggers cache.getWithTTL', () => {
        expect(cacheMock.getWithTTL).toHaveBeenCalledWith(
          'BTCUSDT-disable-action'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual({
          isDisabled: false,
          ttl: -2
        });
      });
    });
  });

  describe('deleteDisableAction', () => {
    beforeEach(async () => {
      const { cache, logger } = require('../../../helpers');

      cacheMock = cache;
      loggerMock = logger;

      cacheMock.del = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.deleteDisableAction(loggerMock, 'BTCUSDT');
    });

    it('triggers cache.del', () => {
      expect(cacheMock.del).toHaveBeenCalledWith('BTCUSDT-disable-action');
    });

    it('returns expected value', () => {
      expect(result).toBeTruthy();
    });
  });

  describe('isExceedAPILimit', () => {
    describe('when getInfo returned undefined', () => {
      beforeEach(() => {
        const { binance, logger } = require('../../../helpers');

        loggerMock = logger;
        binanceMock = binance;

        binanceMock.client.getInfo = jest.fn().mockReturnValueOnce(undefined);

        result = commonHelper.isExceedAPILimit(loggerMock);
      });

      it('retruns expected value', () => {
        expect(result).toBeFalsy();
      });
    });

    describe('when getInfo returned without spot', () => {
      beforeEach(() => {
        const { binance, logger } = require('../../../helpers');

        loggerMock = logger;
        binanceMock = binance;

        binanceMock.client.getInfo = jest.fn().mockReturnValueOnce({
          futures: {}
        });

        result = commonHelper.isExceedAPILimit(loggerMock);
      });

      it('retruns expected value', () => {
        expect(result).toBeFalsy();
      });
    });

    describe('when getInfo returned with spot', () => {
      describe('less than 1180', () => {
        beforeEach(() => {
          const { binance, logger } = require('../../../helpers');

          loggerMock = logger;
          binanceMock = binance;

          binanceMock.client.getInfo = jest.fn().mockReturnValueOnce({
            spot: { usedWeight1m: '100' }
          });

          result = commonHelper.isExceedAPILimit(loggerMock);
        });

        it('retruns expected value', () => {
          expect(result).toBeFalsy();
        });
      });

      describe('more than 1180', () => {
        beforeEach(() => {
          const { binance, logger } = require('../../../helpers');

          loggerMock = logger;
          binanceMock = binance;

          binanceMock.client.getInfo = jest.fn().mockReturnValueOnce({
            spot: { usedWeight1m: '1180' }
          });

          result = commonHelper.isExceedAPILimit(loggerMock);
        });

        it('retruns expected value', () => {
          expect(result).toBeFalsy();
        });
      });
    });
  });

  describe('getOverrideDataForSymbol', () => {
    describe('when there is override data', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(
          JSON.stringify({
            action: 'manual-trade',
            order: {
              some: 'value'
            }
          })
        );

        commonHelper = require('../common');

        result = await commonHelper.getOverrideDataForSymbol(
          loggerMock,
          'BTCUSDT'
        );
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-override',
          'BTCUSDT'
        );
      });

      it('retruns expected value', () => {
        expect(result).toStrictEqual({
          action: 'manual-trade',
          order: {
            some: 'value'
          }
        });
      });
    });

    describe('when there is no override', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getOverrideDataForSymbol(
          loggerMock,
          'BTCUSDT'
        );
      });

      it('retruns expected value', () => {
        expect(result).toBeNull();
      });
    });
  });

  describe('removeOverrideDataForSymbol', () => {
    beforeEach(async () => {
      const { cache, logger } = require('../../../helpers');

      loggerMock = logger;
      cacheMock = cache;

      cacheMock.hdel = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');

      result = await commonHelper.removeOverrideDataForSymbol(
        loggerMock,
        'BTCUSDT'
      );
    });

    it('triggers cache.hdel', () => {
      expect(cacheMock.hdel).toHaveBeenCalledWith(
        'trailing-trade-override',
        'BTCUSDT'
      );
    });
  });

  describe('getOverrideDataForIndicator', () => {
    describe('when there is override data', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(
          JSON.stringify({
            action: 'dust-transfer',
            order: {
              some: 'value'
            }
          })
        );

        commonHelper = require('../common');

        result = await commonHelper.getOverrideDataForIndicator(
          loggerMock,
          'global'
        );
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-indicator-override',
          'global'
        );
      });

      it('retruns expected value', () => {
        expect(result).toStrictEqual({
          action: 'dust-transfer',
          order: {
            some: 'value'
          }
        });
      });
    });

    describe('when there is no override', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getOverrideDataForIndicator(
          loggerMock,
          'global'
        );
      });

      it('retruns expected value', () => {
        expect(result).toBeNull();
      });
    });
  });

  describe('removeOverrideDataForIndicator', () => {
    beforeEach(async () => {
      const { cache, logger } = require('../../../helpers');

      loggerMock = logger;
      cacheMock = cache;

      cacheMock.hdel = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');

      result = await commonHelper.removeOverrideDataForIndicator(
        loggerMock,
        'global'
      );
    });

    it('triggers cache.hdel', () => {
      expect(cacheMock.hdel).toHaveBeenCalledWith(
        'trailing-trade-indicator-override',
        'global'
      );
    });
  });

  describe('calculateLastBuyPrice', () => {
    describe('when last buy price is not recorded', () => {
      beforeEach(async () => {
        const {
          cache,
          logger,
          mongo,
          PubSub,
          slack
        } = require('../../../helpers');

        loggerMock = logger;
        mongoMock = mongo;
        PubSubMock = PubSub;
        slackMock = slack;
        cacheMock = cache;

        mongoMock.findOne = jest.fn().mockResolvedValue({});
        mongoMock.upsertOne = jest.fn().mockResolvedValue(true);
        PubSubMock.publish = jest.fn().mockResolvedValue(true);
        slackMock.sendMessage = jest.fn().mockResolvedValue(true);
        cacheMock.hdel = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        await commonHelper.calculateLastBuyPrice(loggerMock, 'BTCUSDT', {
          type: 'buy',
          executedQty: '0.07840000',
          cummulativeQuoteQty: '19.94260800'
        });
      });

      it('triggers getLastBuyPrice', () => {
        expect(mongoMock.findOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          { key: 'BTCUSDT-last-buy-price' }
        );
      });

      it('triggers saveLastBuyPrice', () => {
        expect(mongoMock.upsertOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          {
            key: 'BTCUSDT-last-buy-price'
          },
          {
            key: 'BTCUSDT-last-buy-price',
            lastBuyPrice: 254.37,
            quantity: 0.0784
          }
        );
      });

      it('triggers PubSub.publish', () => {
        expect(PubSubMock.publish).toHaveBeenCalled();
      });

      it('triggers slack.sendMessage', () => {
        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining(
            JSON.stringify(
              {
                orgLastBuyPrice: 0,
                orgQuantity: 0,
                orgTotalAmount: 0,
                newLastBuyPrice: 254.37,
                newQuantity: 0.0784,
                newTotalAmount: 19.942608
              },
              undefined,
              2
            )
          )
        );
      });
    });

    describe('when last buy price is recorded', () => {
      beforeEach(async () => {
        const {
          logger,
          mongo,
          PubSub,
          slack,
          cache
        } = require('../../../helpers');

        loggerMock = logger;
        mongoMock = mongo;
        PubSubMock = PubSub;
        slackMock = slack;
        cacheMock = cache;

        mongoMock.findOne = jest.fn().mockResolvedValue({
          lastBuyPrice: 254.37,
          quantity: 0.0784
        });
        mongoMock.upsertOne = jest.fn().mockResolvedValue(true);
        PubSubMock.publish = jest.fn().mockResolvedValue(true);
        slackMock.sendMessage = jest.fn().mockResolvedValue(true);
        cacheMock.hdel = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        await commonHelper.calculateLastBuyPrice(loggerMock, 'BTCUSDT', {
          type: 'buy',
          executedQty: '0.05',
          cummulativeQuoteQty: '30'
        });
      });

      it('triggers getLastBuyPrice', () => {
        expect(mongoMock.findOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          { key: 'BTCUSDT-last-buy-price' }
        );
      });

      it('triggers saveLastBuyPrice', () => {
        expect(mongoMock.upsertOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          {
            key: 'BTCUSDT-last-buy-price'
          },
          {
            key: 'BTCUSDT-last-buy-price',
            lastBuyPrice: 388.96112149532706,
            quantity: 0.12840000000000001
          }
        );
      });

      it('triggers PubSub.publish', () => {
        expect(PubSubMock.publish).toHaveBeenCalled();
      });

      it('triggers slack.sendMessage', () => {
        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining(
            JSON.stringify(
              {
                orgLastBuyPrice: 254.37,
                orgQuantity: 0.0784,
                orgTotalAmount: 19.942608,
                newLastBuyPrice: 388.96112149532706,
                newQuantity: 0.12840000000000001,
                newTotalAmount: 49.942608
              },
              undefined,
              2
            )
          )
        );
      });
    });
  });

  describe('getSymbolInfo', () => {
    describe('when symbol cache exists', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.hget = jest.fn().mockImplementation(() =>
          Promise.resolve(
            JSON.stringify({
              some: 'value'
            })
          )
        );

        commonHelper = require('../common');
        result = await commonHelper.getSymbolInfo(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-symbols',
          'BTCUSDT-symbol-info'
        );
      });

      it('returns expected result', () => {
        expect(result).toStrictEqual({
          some: 'value'
        });
      });
    });

    describe('when cached exchange info does not exist', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;
        loggerMock = logger;

        cacheMock.hset = jest.fn().mockResolvedValue(true);
        cacheMock.hget = jest
          .fn()
          .mockImplementation((_key, _hash) => Promise.resolve(null));

        binanceMock.client.exchangeInfo = jest
          .fn()
          .mockResolvedValue(
            _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
          );

        commonHelper = require('../common');
        result = await commonHelper.getSymbolInfo(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-symbols',
          'BTCUSDT-symbol-info'
        );
      });

      it('triggers cache.hset for exchange-info', () => {
        expect(cacheMock.hset.mock.calls[0][0]).toStrictEqual(
          'trailing-trade-common'
        );
        expect(cacheMock.hset.mock.calls[0][1]).toStrictEqual('exchange-info');
        const args = JSON.parse(cacheMock.hset.mock.calls[0][2]);
        expect(args).toStrictEqual(
          _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
        );
      });

      it('triggers binance.client.exchangeInfo', () => {
        expect(binanceMock.client.exchangeInfo).toHaveBeenCalled();
      });

      it('triggers cache.hset for final symbol info', () => {
        expect(cacheMock.hset.mock.calls[1][0]).toStrictEqual(
          'trailing-trade-symbols'
        );
        expect(cacheMock.hset.mock.calls[1][1]).toStrictEqual(
          'BTCUSDT-symbol-info'
        );
        const args = JSON.parse(cacheMock.hset.mock.calls[1][2]);
        expect(args).toStrictEqual({
          baseAsset: 'BTC',
          baseAssetPrecision: 8,
          filterLotSize: {
            filterType: 'LOT_SIZE',
            maxQty: '900.00000000',
            minQty: '0.00000100',
            stepSize: '0.00000100'
          },
          filterMinNotional: {
            applyToMarket: true,
            avgPriceMins: 5,
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000'
          },
          filterPrice: {
            filterType: 'PRICE_FILTER',
            maxPrice: '1000000.00000000',
            minPrice: '0.01000000',
            tickSize: '0.01000000'
          },
          quoteAsset: 'USDT',
          quotePrecision: 8,
          status: 'TRADING',
          symbol: 'BTCUSDT'
        });
      });

      it('returns expected result', () => {
        expect(result).toStrictEqual({
          baseAsset: 'BTC',
          baseAssetPrecision: 8,
          filterLotSize: {
            filterType: 'LOT_SIZE',
            maxQty: '900.00000000',
            minQty: '0.00000100',
            stepSize: '0.00000100'
          },
          filterMinNotional: {
            applyToMarket: true,
            avgPriceMins: 5,
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000'
          },
          filterPrice: {
            filterType: 'PRICE_FILTER',
            maxPrice: '1000000.00000000',
            minPrice: '0.01000000',
            tickSize: '0.01000000'
          },
          quoteAsset: 'USDT',
          quotePrecision: 8,
          status: 'TRADING',
          symbol: 'BTCUSDT'
        });
      });
    });

    describe('when cached exchange info exists', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;
        loggerMock = logger;

        cacheMock.hset = jest.fn().mockResolvedValue(true);
        cacheMock.hget = jest.fn().mockImplementation((key, hash) => {
          if (key === 'trailing-trade-common' && hash === 'exchange-info') {
            return Promise.resolve(
              JSON.stringify(
                _.cloneDeep(require('./fixtures/binance-exchange-info.json'))
              )
            );
          }
          return Promise.resolve(null);
        });

        binanceMock.client.exchangeInfo = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        result = await commonHelper.getSymbolInfo(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-symbols',
          'BTCUSDT-symbol-info'
        );
      });

      it('does not trigger cache.hset for exchange-info', () => {
        expect(cacheMock.hset.mock.calls[0][0]).not.toStrictEqual(
          'trailing-trade-common'
        );
        expect(cacheMock.hset.mock.calls[0][1]).not.toStrictEqual(
          'exchange-info'
        );
      });

      it('does not trigger binance.client.exchangeInfo', () => {
        expect(binanceMock.client.exchangeInfo).not.toHaveBeenCalled();
      });

      it('triggers cache.hset for final symbol info', () => {
        expect(cacheMock.hset.mock.calls[0][0]).toStrictEqual(
          'trailing-trade-symbols'
        );
        expect(cacheMock.hset.mock.calls[0][1]).toStrictEqual(
          'BTCUSDT-symbol-info'
        );
        const args = JSON.parse(cacheMock.hset.mock.calls[0][2]);
        expect(args).toStrictEqual({
          baseAsset: 'BTC',
          baseAssetPrecision: 8,
          filterLotSize: {
            filterType: 'LOT_SIZE',
            maxQty: '900.00000000',
            minQty: '0.00000100',
            stepSize: '0.00000100'
          },
          filterMinNotional: {
            applyToMarket: true,
            avgPriceMins: 5,
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000'
          },
          filterPrice: {
            filterType: 'PRICE_FILTER',
            maxPrice: '1000000.00000000',
            minPrice: '0.01000000',
            tickSize: '0.01000000'
          },
          quoteAsset: 'USDT',
          quotePrecision: 8,
          status: 'TRADING',
          symbol: 'BTCUSDT'
        });
      });

      it('returns expected result', () => {
        expect(result).toStrictEqual({
          baseAsset: 'BTC',
          baseAssetPrecision: 8,
          filterLotSize: {
            filterType: 'LOT_SIZE',
            maxQty: '900.00000000',
            minQty: '0.00000100',
            stepSize: '0.00000100'
          },
          filterMinNotional: {
            applyToMarket: true,
            avgPriceMins: 5,
            filterType: 'MIN_NOTIONAL',
            minNotional: '10.00000000'
          },
          filterPrice: {
            filterType: 'PRICE_FILTER',
            maxPrice: '1000000.00000000',
            minPrice: '0.01000000',
            tickSize: '0.01000000'
          },
          quoteAsset: 'USDT',
          quotePrecision: 8,
          status: 'TRADING',
          symbol: 'BTCUSDT'
        });
      });
    });
  });

  describe('verifyAuthenticated', () => {
    describe('when authentication is not enabled', () => {
      beforeEach(async () => {
        mockConfigGet = jest.fn(key => {
          if (key === 'authentication.enabled') {
            return false;
          }
          return null;
        });

        jest.mock('config', () => ({
          get: mockConfigGet
        }));

        mockJWTVerify = jest.fn().mockReturnValue(true);

        jest.mock('jsonwebtoken', () => ({
          verify: mockJWTVerify
        }));

        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.get = jest.fn().mockResolvedValue('my-config');

        commonHelper = require('../common');
        result = await commonHelper.verifyAuthenticated(
          loggerMock,
          'auth-token'
        );
      });

      it('triggers config.get', () => {
        expect(mockConfigGet).toHaveBeenCalledWith('authentication.enabled');
      });

      it('does not trigger cache.get', () => {
        expect(cacheMock.get).not.toHaveBeenCalled();
      });

      it('does not trigger jwt.verify', () => {
        expect(mockJWTVerify).not.toHaveBeenCalled();
      });

      it('returns true', () => {
        expect(result).toBeTruthy();
      });
    });

    describe('when authentication is enabled', () => {
      describe('verification failed', () => {
        beforeEach(async () => {
          mockConfigGet = jest.fn(key => {
            if (key === 'authentication.enabled') {
              return true;
            }
            return null;
          });

          jest.mock('config', () => ({
            get: mockConfigGet
          }));

          mockJWTVerify = jest.fn().mockImplementation(() => {
            throw new Error('something happened');
          });

          jest.mock('jsonwebtoken', () => ({
            verify: mockJWTVerify
          }));

          const { cache, logger } = require('../../../helpers');

          cacheMock = cache;
          loggerMock = logger;

          cacheMock.get = jest.fn().mockResolvedValue('my-jwt-secret');

          commonHelper = require('../common');
          result = await commonHelper.verifyAuthenticated(
            loggerMock,
            'auth-token'
          );
        });

        it('triggers config.get', () => {
          expect(mockConfigGet).toHaveBeenCalledWith('authentication.enabled');
        });

        it('triggers cache.get', () => {
          expect(cacheMock.get).toHaveBeenCalledWith('auth-jwt-secret');
        });

        it('triggers jwt.verify', () => {
          expect(mockJWTVerify).toHaveBeenCalledWith(
            'auth-token',
            'my-jwt-secret',
            { algorithm: 'HS256' }
          );
        });

        it('returns false', () => {
          expect(result).toBeFalsy();
        });
      });

      describe('verification success', () => {
        beforeEach(async () => {
          mockConfigGet = jest.fn(key => {
            if (key === 'authentication.enabled') {
              return true;
            }
            return null;
          });

          jest.mock('config', () => ({
            get: mockConfigGet
          }));

          mockJWTVerify = jest.fn().mockReturnValue({
            some: 'value'
          });

          jest.mock('jsonwebtoken', () => ({
            verify: mockJWTVerify
          }));

          const { cache, logger } = require('../../../helpers');

          cacheMock = cache;
          loggerMock = logger;

          cacheMock.get = jest.fn().mockResolvedValue('my-jwt-secret');

          commonHelper = require('../common');
          result = await commonHelper.verifyAuthenticated(
            loggerMock,
            'auth-token'
          );
        });

        it('triggers config.get', () => {
          expect(mockConfigGet).toHaveBeenCalledWith('authentication.enabled');
        });

        it('triggers cache.get', () => {
          expect(cacheMock.get).toHaveBeenCalledWith('auth-jwt-secret');
        });

        it('triggers jwt.verify', () => {
          expect(mockJWTVerify).toHaveBeenCalledWith(
            'auth-token',
            'my-jwt-secret',
            { algorithm: 'HS256' }
          );
        });

        it('returns true', () => {
          expect(result).toBeTruthy();
        });
      });
    });
  });

  describe('saveNumberOfBuyOpenOrders', () => {
    beforeEach(async () => {
      const { mongo, cache, logger } = require('../../../helpers');

      mongoMock = mongo;
      loggerMock = logger;
      cacheMock = cache;

      mongoMock.count = jest.fn().mockResolvedValue(3);

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.saveNumberOfBuyOpenOrders(loggerMock, [
        'BTCUSDT',
        'BNBUSDT'
      ]);
    });

    it('triggers mongo.count', () => {
      expect(mongoMock.count).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-grid-trade-orders',
        {
          key: {
            $regex: `(BTCUSDT|BNBUSDT)-grid-trade-last-buy-order`
          }
        }
      );
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledWith(
        'trailing-trade-common',
        'number-of-buy-open-orders',
        3
      );
    });
  });

  describe('getNumberOfBuyOpenOrders', () => {
    describe('when value is available', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(3);

        commonHelper = require('../common');
        result = await commonHelper.getNumberOfBuyOpenOrders(loggerMock);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'number-of-buy-open-orders'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(3);
      });
    });

    describe('when value is not available', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getNumberOfBuyOpenOrders(loggerMock);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'number-of-buy-open-orders'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(0);
      });
    });
  });

  describe('saveNumberOfOpenTrades', () => {
    beforeEach(async () => {
      const { mongo, cache, logger } = require('../../../helpers');

      mongoMock = mongo;
      loggerMock = logger;
      cacheMock = cache;

      mongoMock.count = jest.fn().mockResolvedValue(3);

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.saveNumberOfOpenTrades(loggerMock, [
        'BTCUSDT',
        'BNBUSDT'
      ]);
    });

    it('triggers mongo.count', () => {
      expect(mongoMock.count).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-symbols',
        {
          key: {
            $regex: `(BTCUSDT|BNBUSDT)-last-buy-price`
          }
        }
      );
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledWith(
        'trailing-trade-common',
        'number-of-open-trades',
        3
      );
    });
  });

  describe('getNumberOfOpenTrades', () => {
    describe('when value is available', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(3);

        commonHelper = require('../common');
        result = await commonHelper.getNumberOfOpenTrades(loggerMock);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'number-of-open-trades'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(3);
      });
    });

    describe('when value is not available', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        loggerMock = logger;
        cacheMock = cache;

        cacheMock.hget = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getNumberOfOpenTrades(loggerMock);
      });

      it('triggers cache.hget', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'number-of-open-trades'
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(0);
      });
    });
  });

  describe('saveOrderStats', () => {
    beforeEach(async () => {
      const { mongo, cache, logger } = require('../../../helpers');

      mongoMock = mongo;
      loggerMock = logger;
      cacheMock = cache;

      mongoMock.count = jest.fn().mockResolvedValue(3);

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.saveOrderStats(loggerMock, [
        'BTCUSDT',
        'BNBUSDT'
      ]);
    });

    it('triggers mongo.count twice', () => {
      expect(mongoMock.count).toHaveBeenCalledTimes(2);
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveOverrideAction', () => {
    beforeEach(() => {
      const { cache, slack, PubSub, logger } = require('../../../helpers');

      slackMock = slack;
      loggerMock = logger;
      PubSubMock = PubSub;
      cacheMock = cache;

      cacheMock.hset = jest.fn().mockResolvedValue(true);
      slackMock.sendMessage = jest.fn().mockResolvedValue(true);
      PubSubMock.publish = jest.fn().mockResolvedValue(true);
      commonHelper = require('../common');
    });

    describe('without notify flag determined', () => {
      beforeEach(async () => {
        result = await commonHelper.saveOverrideAction(
          loggerMock,
          'BTCUSDT',
          {
            action: 'buy',
            actionAt: '2021-09-22T00:20:00Z',
            triggeredBy: 'auto-trigger'
          },
          `The bot queued to trigger the grid trade for buying` +
            ` after 20 minutes later.`
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-override',
          'BTCUSDT',
          JSON.stringify({
            action: 'buy',
            actionAt: '2021-09-22T00:20:00Z',
            triggeredBy: 'auto-trigger'
          })
        );
      });

      it('triggers slack.sendMessage', () => {
        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining('BTCUSDT')
        );

        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining(
            'The bot queued to trigger the grid trade for buying'
          )
        );
      });

      it('triggers PubSub.publish', () => {
        expect(PubSubMock.publish).toHaveBeenCalledWith(
          'frontend-notification',
          {
            type: 'info',
            title:
              `The bot queued to trigger the grid trade for buying` +
              ` after 20 minutes later.`
          }
        );
      });
    });

    describe('with notify flag is true', () => {
      beforeEach(async () => {
        result = await commonHelper.saveOverrideAction(
          loggerMock,
          'BTCUSDT',
          {
            action: 'buy',
            actionAt: '2021-09-22T00:20:00Z',
            triggeredBy: 'auto-trigger',
            notify: true
          },
          `The bot queued to trigger the grid trade for buying` +
            ` after 20 minutes later.`
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-override',
          'BTCUSDT',
          JSON.stringify({
            action: 'buy',
            actionAt: '2021-09-22T00:20:00Z',
            triggeredBy: 'auto-trigger',
            notify: true
          })
        );
      });

      it('triggers slack.sendMessage', () => {
        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining('BTCUSDT')
        );

        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining(
            'The bot queued to trigger the grid trade for buying'
          )
        );
      });

      it('triggers PubSub.publish', () => {
        expect(PubSubMock.publish).toHaveBeenCalledWith(
          'frontend-notification',
          {
            type: 'info',
            title:
              `The bot queued to trigger the grid trade for buying` +
              ` after 20 minutes later.`
          }
        );
      });
    });

    describe('with notify flag is false', () => {
      beforeEach(async () => {
        result = await commonHelper.saveOverrideAction(
          loggerMock,
          'BTCUSDT',
          {
            action: 'buy',
            actionAt: '2021-09-22T00:20:00Z',
            triggeredBy: 'auto-trigger',
            notify: false
          },
          `The bot queued to trigger the grid trade for buying` +
            ` after 20 minutes later.`
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-override',
          'BTCUSDT',
          JSON.stringify({
            action: 'buy',
            actionAt: '2021-09-22T00:20:00Z',
            triggeredBy: 'auto-trigger',
            notify: false
          })
        );
      });

      it('does not trigger slack.sendMessage', () => {
        expect(slackMock.sendMessage).not.toHaveBeenCalled();
      });

      it('does not trigger PubSub.publish', () => {
        expect(PubSubMock.publish).not.toHaveBeenCalled();
      });
    });
  });

  describe('saveOverrideIndicatorAction', () => {
    beforeEach(() => {
      const { cache, slack, PubSub, logger } = require('../../../helpers');

      slackMock = slack;
      loggerMock = logger;
      PubSubMock = PubSub;
      cacheMock = cache;

      cacheMock.hset = jest.fn().mockResolvedValue(true);
      slackMock.sendMessage = jest.fn().mockResolvedValue(true);
      PubSubMock.publish = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
    });

    describe('without notify flag determined', () => {
      beforeEach(async () => {
        result = await commonHelper.saveOverrideIndicatorAction(
          loggerMock,
          'global',
          {
            action: 'dust-transfer',
            params: {
              some: 'param'
            },
            actionAt: '2021-09-25T00:00:00Z',
            triggeredBy: 'user'
          },
          'The dust transfer request received by the bot. Wait for executing the dust transfer.'
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-indicator-override',
          'global',
          JSON.stringify({
            action: 'dust-transfer',
            params: {
              some: 'param'
            },
            actionAt: '2021-09-25T00:00:00Z',
            triggeredBy: 'user'
          })
        );
      });

      it('triggers slack.sendMessage', () => {
        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining(
            'The dust transfer request received by the bot. Wait for executing the dust transfer.'
          )
        );
      });

      it('triggers PubSub.publish', () => {
        expect(PubSubMock.publish).toHaveBeenCalledWith(
          'frontend-notification',
          {
            type: 'info',
            title:
              'The dust transfer request received by the bot. Wait for executing the dust transfer.'
          }
        );
      });
    });

    describe('with notify flag is true', () => {
      beforeEach(async () => {
        result = await commonHelper.saveOverrideIndicatorAction(
          loggerMock,
          'global',
          {
            action: 'dust-transfer',
            params: {
              some: 'param'
            },
            actionAt: '2021-09-25T00:00:00Z',
            triggeredBy: 'user',
            notify: true
          },
          'The dust transfer request received by the bot. Wait for executing the dust transfer.'
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-indicator-override',
          'global',
          JSON.stringify({
            action: 'dust-transfer',
            params: {
              some: 'param'
            },
            actionAt: '2021-09-25T00:00:00Z',
            triggeredBy: 'user',
            notify: true
          })
        );
      });

      it('triggers slack.sendMessage', () => {
        expect(slackMock.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining(
            'The dust transfer request received by the bot. Wait for executing the dust transfer.'
          )
        );
      });

      it('triggers PubSub.publish', () => {
        expect(PubSubMock.publish).toHaveBeenCalledWith(
          'frontend-notification',
          {
            type: 'info',
            title:
              'The dust transfer request received by the bot. Wait for executing the dust transfer.'
          }
        );
      });
    });

    describe('with notify flag is false', () => {
      beforeEach(async () => {
        result = await commonHelper.saveOverrideIndicatorAction(
          loggerMock,
          'global',
          {
            action: 'dust-transfer',
            params: {
              some: 'param'
            },
            actionAt: '2021-09-25T00:00:00Z',
            triggeredBy: 'user',
            notify: false
          },
          'The dust transfer request received by the bot. Wait for executing the dust transfer.'
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-indicator-override',
          'global',
          JSON.stringify({
            action: 'dust-transfer',
            params: {
              some: 'param'
            },
            actionAt: '2021-09-25T00:00:00Z',
            triggeredBy: 'user',
            notify: false
          })
        );
      });

      it('does not trigger slack.sendMessage', () => {
        expect(slackMock.sendMessage).not.toHaveBeenCalled();
      });

      it('does not trigger PubSub.publish', () => {
        expect(PubSubMock.publish).not.toHaveBeenCalled();
      });
    });
  });

  describe('saveCandle', () => {
    beforeEach(async () => {
      const { mongo, logger } = require('../../../helpers');

      mongoMock = mongo;
      loggerMock = logger;

      mongoMock.upsertOne = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      /**
       * Sample candle
         {
            eventType: 'kline',
            eventTime: 1657974109931,
            symbol: 'BTCUSDT',
            startTime: 1657972800000,
            closeTime: 1657976399999,
            firstTradeId: 1522267,
            lastTradeId: 1524026,
            open: '20616.72000000',
            high: '20630.48000000',
            low: '20595.11000000',
            close: '20629.04000000',
            volume: '93.17161900',
            trades: 1760,
            interval: '1h',
            isFinal: false,
            quoteVolume: '1920563.72755657',
            buyVolume: '53.56450300',
            quoteBuyVolume: '1104135.90026963'
          }
       */
      result = await commonHelper.saveCandle(
        loggerMock,
        'trailing-trade-candles',
        {
          key: 'BTCUSDT',
          interval: 10,
          time: 1657972800000,
          open: 20616.72,
          high: 20630.48,
          low: 20595.11,
          close: 20629.04,
          volume: 93.171619
        }
      );
    });

    it('triggers mongo.upsertOne', () => {
      expect(mongoMock.upsertOne).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-candles',
        {
          key: 'BTCUSDT',
          time: 1657972800000,
          interval: 10
        },
        {
          key: 'BTCUSDT',
          interval: 10,
          time: 1657972800000,
          open: 20616.72,
          high: 20630.48,
          low: 20595.11,
          close: 20629.04,
          volume: 93.171619
        }
      );
    });
  });

  describe('updateAccountInfo', () => {
    beforeEach(() => {
      const { mongo, cache, logger } = require('../../../helpers');

      cacheMock = cache;
      mongoMock = mongo;
      loggerMock = logger;
      cacheMock.hset = jest.fn().mockResolvedValue(true);
    });

    describe('when there is no 0 balance', () => {
      beforeEach(async () => {
        cacheMock.hgetWithoutLock = jest
          .fn()
          .mockResolvedValue(
            JSON.stringify(
              require('./fixtures/binance-cached-account-info.json')
            )
          );

        commonHelper = require('../common');

        result = await commonHelper.updateAccountInfo(
          loggerMock,
          [
            {
              asset: 'USDT',
              free: 9000,
              locked: 1000
            }
          ],
          '2022-07-16T00:00:00'
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info',
          JSON.stringify({
            makerCommission: 0,
            takerCommission: 0,
            buyerCommission: 0,
            sellerCommission: 0,
            canTrade: true,
            canWithdraw: false,
            canDeposit: false,
            updateTime: '2022-07-16T00:00:00',
            accountType: 'SPOT',
            balances: [
              { asset: 'BNB', free: '1000.00000000', locked: '0.00000000' },
              { asset: 'ETH', free: '100.00000000', locked: '0.00000000' },
              { asset: 'TRX', free: '500000.00000000', locked: '0.00000000' },
              { asset: 'USDT', free: 9000, locked: 1000 },
              { asset: 'XRP', free: '50000.00000000', locked: '0.00000000' }
            ],
            permissions: ['SPOT']
          })
        );
      });
    });

    describe('when there is 0 balance', () => {
      beforeEach(async () => {
        cacheMock.hgetWithoutLock = jest.fn().mockResolvedValue(
          JSON.stringify({
            updateTime: '2022-07-16T00:00:00',
            balances: [
              { asset: 'BNB', free: '0', locked: '0' },
              { asset: 'ETH', free: '100.00000000', locked: '0.00000000' },
              { asset: 'TRX', free: '500000.00000000', locked: '0.00000000' },
              { asset: 'USDT', free: '9000.00000000', locked: '1000.00000000' },
              { asset: 'XRP', free: '50000.00000000', locked: '0.00000000' }
            ]
          })
        );

        commonHelper = require('../common');

        result = await commonHelper.updateAccountInfo(
          loggerMock,
          [
            {
              asset: 'USDT',
              free: 9000,
              locked: 1000
            }
          ],
          '2022-07-16T00:00:00'
        );
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info',
          JSON.stringify({
            updateTime: '2022-07-16T00:00:00',
            balances: [
              { asset: 'ETH', free: '100.00000000', locked: '0.00000000' },
              { asset: 'TRX', free: '500000.00000000', locked: '0.00000000' },
              { asset: 'USDT', free: 9000, locked: 1000 },
              { asset: 'XRP', free: '50000.00000000', locked: '0.00000000' }
            ]
          })
        );
      });
    });
  });

  describe('getCacheTrailingTradeSymbols', () => {
    [
      {
        desc: 'default',
        sortByDesc: false,
        sortByParam: null,
        searchKeyword: 'BTC',
        page: 2,
        sortField: {
          $cond: {
            if: { $gt: [{ $size: '$buy.openOrders' }, 0] },
            then: {
              $multiply: [
                {
                  $add: [
                    {
                      $let: {
                        vars: {
                          buyOpenOrder: {
                            $arrayElemAt: ['$buy.openOrders', 0]
                          }
                        },
                        in: '$buyOpenOrder.differenceToCancel'
                      }
                    },
                    3000
                  ]
                },
                -10
              ]
            },
            else: {
              $cond: {
                if: { $gt: [{ $size: '$sell.openOrders' }, 0] },
                then: {
                  $multiply: [
                    {
                      $add: [
                        {
                          $let: {
                            vars: {
                              sellOpenOrder: {
                                $arrayElemAt: ['$sell.openOrders', 0]
                              }
                            },
                            in: '$sellOpenOrder.differenceToCancel'
                          }
                        },
                        2000
                      ]
                    },
                    -10
                  ]
                },
                else: {
                  $cond: {
                    if: {
                      $eq: ['$sell.difference', null]
                    },
                    then: '$buy.difference',
                    else: {
                      $multiply: [{ $add: ['$sell.difference', 1000] }, -10]
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        desc: 'buy-difference',
        sortByDesc: true,
        sortByParam: 'buy-difference',
        searchKeyword: 'BTC',
        page: 2,
        sortField: {
          $cond: {
            if: {
              $eq: ['$buy.difference', null]
            },
            then: -999,
            else: '$buy.difference'
          }
        }
      },
      {
        desc: 'buy-difference',
        sortByDesc: false,
        sortByParam: 'buy-difference',
        searchKeyword: 'BTC',
        page: 2,
        sortField: {
          $cond: {
            if: {
              $eq: ['$buy.difference', null]
            },
            then: 999,
            else: '$buy.difference'
          }
        }
      },
      {
        desc: 'sell-profit',
        sortByDesc: false,
        sortByParam: 'sell-profit',
        searchKeyword: null,
        page: 2,
        sortField: {
          $cond: {
            if: {
              $eq: ['$sell.currentProfitPercentage', null]
            },
            then: 999,
            else: '$sell.currentProfitPercentage'
          }
        }
      },
      {
        desc: 'sell-profit',
        sortByDesc: true,
        sortByParam: 'sell-profit',
        searchKeyword: null,
        page: 2,
        sortField: {
          $cond: {
            if: {
              $eq: ['$sell.currentProfitPercentage', null]
            },
            then: -999,
            else: '$sell.currentProfitPercentage'
          }
        }
      },
      {
        desc: 'alpha',
        sortByDesc: true,
        sortByParam: 'alpha',
        searchKeyword: 'ETH',
        page: 2,
        sortField: '$symbol'
      },
      {
        desc: 'alpha - incorrect page',
        sortByDesc: true,
        sortByParam: 'alpha',
        searchKeyword: 'ETH',
        page: -1,
        sortField: '$symbol'
      },
      {
        desc: 'alpha - no page provided',
        sortByDesc: true,
        sortByParam: 'alpha',
        searchKeyword: 'ETH',
        sortField: '$symbol'
      }
    ].forEach(t => {
      describe(`sortBy - ${t.desc}`, () => {
        beforeEach(async () => {
          const { mongo, logger } = require('../../../helpers');

          mongoMock = mongo;
          loggerMock = logger;

          mongoMock.aggregate = jest.fn().mockResolvedValue({ some: 'data' });
          commonHelper = require('../common');

          result = await commonHelper.getCacheTrailingTradeSymbols(
            loggerMock,
            t.sortByDesc,
            t.sortByParam,
            t.page,
            10,
            t.searchKeyword
          );
        });

        it('triggers mongo.aggregate', () => {
          const pageNum = _.toNumber(t.page) >= 1 ? _.toNumber(t.page) : 1;

          expect(mongoMock.aggregate).toHaveBeenCalledWith(
            loggerMock,
            'trailing-trade-cache',
            [
              {
                $match: t.searchKeyword
                  ? { symbol: { $regex: t.searchKeyword, $options: 'i' } }
                  : {}
              },
              {
                $project: {
                  symbol: '$symbol',
                  lastCandle: '$lastCandle',
                  symbolInfo: '$symbolInfo',
                  symbolConfiguration: '$symbolConfiguration',
                  baseAssetBalance: '$baseAssetBalance',
                  quoteAssetBalance: '$quoteAssetBalance',
                  buy: '$buy',
                  sell: '$sell',
                  tradingView: '$tradingView',
                  overrideData: '$overrideData',
                  sortField: t.sortField
                }
              },
              { $sort: { sortField: t.sortByDesc ? -1 : 1 } },
              { $skip: (pageNum - 1) * 10 },
              { $limit: 10 }
            ]
          );
        });
      });
    });
  });

  describe('getCacheTrailingTradeTotalProfitAndLoss', () => {
    beforeEach(async () => {
      const { mongo, logger } = require('../../../helpers');

      mongoMock = mongo;
      loggerMock = logger;

      mongoMock.aggregate = jest.fn().mockResolvedValue({ some: 'data' });
      commonHelper = require('../common');

      result = await commonHelper.getCacheTrailingTradeTotalProfitAndLoss(
        loggerMock
      );
    });

    it('triggers, mongo.aggregate', () => {
      expect(mongoMock.aggregate).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-cache',
        [
          {
            $group: {
              _id: '$quoteAssetBalance.asset',
              amount: {
                $sum: {
                  $multiply: ['$baseAssetBalance.total', '$sell.lastBuyPrice']
                }
              },
              profit: { $sum: '$sell.currentProfit' },
              estimatedBalance: { $sum: '$baseAssetBalance.estimatedValue' }
            }
          },
          {
            $project: {
              asset: '$_id',
              amount: '$amount',
              profit: '$profit',
              estimatedBalance: '$estimatedBalance'
            }
          }
        ]
      );
    });
  });

  describe('getCacheTrailingTradeQuoteEstimates', () => {
    beforeEach(async () => {
      const { mongo, logger } = require('../../../helpers');

      mongoMock = mongo;
      loggerMock = logger;

      mongoMock.aggregate = jest.fn().mockResolvedValue({ some: 'data' });
      commonHelper = require('../common');

      result = await commonHelper.getCacheTrailingTradeQuoteEstimates(
        loggerMock
      );
    });

    it('triggers, mongo.aggregate', () => {
      expect(mongoMock.aggregate).toHaveBeenCalledWith(
        loggerMock,
        'trailing-trade-cache',
        [
          {
            $match: {
              'baseAssetBalance.estimatedValue': {
                $gt: 0
              }
            }
          },
          {
            $project: {
              baseAsset: '$symbolInfo.baseAsset',
              quoteAsset: '$symbolInfo.quoteAsset',
              estimatedValue: '$baseAssetBalance.estimatedValue',
              tickSize: '$symbolInfo.filterPrice.tickSize'
            }
          }
        ]
      );
    });
  });
});
