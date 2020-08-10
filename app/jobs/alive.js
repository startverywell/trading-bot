const aliveHelper = require('./alive/helper');
const { slack } = require('../helpers');

const execute = async logger => {
  logger.info('Alive: Notify balance and current candle');

  try {
    // 1. Get balance
    const balanceInfo = await aliveHelper.getBalance(logger);

    // 2. Get current candle
    const lastCandle = await aliveHelper.getLastCandle(logger);

    slack.sendMessage(
      `Account Balance:\`\`\`${JSON.stringify(balanceInfo, undefined, 2)}\`\`\`\nLast Candle:\`\`\`${JSON.stringify(
        lastCandle,
        undefined,
        2
      )}\`\`\``
    );
  } catch (e) {
    logger.error(e, 'Execution failed.');
    slack.sendMessage(`Execution failed\n\`\`\`${e.message}\`\`\``);
  }
};

module.exports = { execute };
