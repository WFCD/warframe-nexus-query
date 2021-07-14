'use strict';

/* eslint-disable no-console */

const fetch = require('node-fetch');
const Querier = require('../index.js');

const id = process.env.TEST_WH_ID;
const token = process.env.TEST_WH_TOKEN;
const webhook = `https://canary.discord.com/api/webhooks/${id}/${token}`;

const querier = new Querier({ logger: console, skipNexus: true });

const tearDown = async () => {
  try {
    await querier.stopUpdating();
    console.log('tore down stuff');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

setTimeout(async () => {
  const embeds = await querier.priceCheckQueryAttachment('gara prime', null, 'xb1');
  if (embeds && embeds[0] && embeds[0].fields && embeds[0].fields.length) {
    const res = await fetch(webhook, {
      method: 'POST',
      body: JSON.stringify({ embeds }),
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`response: ${await res.text()}`);
    if (res.ok) {
    } else {
      console.error(`fail! ${res.ok} ${JSON.stringify(embeds)}`);
    }
  } else {
    console.error(JSON.stringify(embeds));
  }
  tearDown();
}, 5000);
