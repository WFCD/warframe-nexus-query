import Querier from '../index.js';

const id = process.env.TEST_WH_ID;
const token = process.env.TEST_WH_TOKEN;
const webhook = `https://discord.com/api/webhooks/${id}/${token}`;
process.env.MARKET_TIMEOUT = 30000;

const querier = new Querier({ logger: console  });

const tearDown = async () => {
  try {
    await querier.stopUpdating();
    console.log('tore down stuff');
    // process.exit(0);
  } catch (e) {
    console.error(e);
    // process.exit(1);
  }
};

const test = async (query, platform) => {
  const embeds = await querier.priceCheckQueryAttachment(query, null, platform);
  if (embeds && embeds[0] && embeds[0].fields && embeds[0].fields.length) {
    const res = await fetch(webhook, {
      method: 'POST',
      body: JSON.stringify({ embeds }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      console.log(`response: ${res.statusText}`);
    } else {
      console.error(`fail! ${res.ok} ${JSON.stringify(embeds)}`);
    }
  } else {
    console.error(JSON.stringify(embeds));
  }
}

await test('loki prime', 'xb1');
await test('nikana prime', 'pc');
await test('garuda prime', 'swi');

await tearDown();
