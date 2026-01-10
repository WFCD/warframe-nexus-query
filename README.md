# warframe-nexus-query

[![Supported by the Warframe Community Developers](https://img.shields.io/badge/Warframe_Comm_Devs-supported-blue.svg?color=2E96EF&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTgiIGhlaWdodD0iMTczIiB2aWV3Qm94PSIwIDAgMjk4IDE3MyI%2BPHBhdGggZD0iTTE4NSA2N2MxNSA4IDI4IDE2IDMxIDE5czIzIDE4LTcgNjBjMCAwIDM1LTMxIDI2LTc5LTE0LTctNjItMzYtNzAtNDUtNC01LTEwLTEyLTE1LTIyLTUgMTAtOSAxNC0xNSAyMi0xMyAxMy01OCAzOC03MiA0NS05IDQ4IDI2IDc5IDI2IDc5LTMwLTQyLTEwLTU3LTctNjBsMzEtMTkgMzYtMjIgMzYgMjJ6TTU1IDE3M2wtMTctM2MtOC0xOS0yMC00NC0yNC01MC01LTctNy0xMS0xNC0xNWwxOC0yYzE2LTMgMjItNyAzMi0xMyAxIDYgMCA5IDIgMTQtNiA0LTIxIDEwLTI0IDE2IDMgMTQgNSAyNyAyNyA1M3ptMTYtMTFsLTktMi0xNC0yOWEzMCAzMCAwIDAgMC04LThoN2wxMy00IDQgN2MtMyAyLTcgMy04IDZhODYgODYgMCAwIDAgMTUgMzB6bTE3MiAxMWwxNy0zYzgtMTkgMjAtNDQgMjQtNTAgNS03IDctMTEgMTQtMTVsLTE4LTJjLTE2LTMtMjItNy0zMi0xMy0xIDYgMCA5LTIgMTQgNiA0IDIxIDEwIDI0IDE2LTMgMTQtNSAyNy0yNyA1M3ptLTE2LTExbDktMiAxNC0yOWEzMCAzMCAwIDAgMSA4LThoLTdsLTEzLTQtNCA3YzMgMiA3IDMgOCA2YTg2IDg2IDAgMCAxLTE1IDMwem0tNzktNDBsLTYtNmMtMSAzLTMgNi02IDdsNSA1YTUgNSAwIDAgMSAyIDB6bS0xMy0yYTQgNCAwIDAgMSAxLTJsMi0yYTQgNCAwIDAgMSAyLTFsNC0xNy0xNy0xMC04IDcgMTMgOC0yIDctNyAyLTgtMTItOCA4IDEwIDE3em0xMiAxMWE1IDUgMCAwIDAtNC0yIDQgNCAwIDAgMC0zIDFsLTMwIDI3YTUgNSAwIDAgMCAwIDdsNCA0YTYgNiAwIDAgMCA0IDIgNSA1IDAgMCAwIDMtMWwyNy0zMWMyLTIgMS01LTEtN3ptMzkgMjZsLTMwLTI4LTYgNmE1IDUgMCAwIDEgMCAzbDI2IDI5YTEgMSAwIDAgMCAxIDBsNS0yIDItMmMxLTIgMy01IDItNnptNS00NWEyIDIgMCAwIDAtNCAwbC0xIDEtMi00YzEtMy01LTktNS05LTEzLTE0LTIzLTE0LTI3LTEzLTIgMS0yIDEgMCAyIDE0IDIgMTUgMTAgMTMgMTNhNCA0IDAgMCAwLTEgMyAzIDMgMCAwIDAgMSAxbC0yMSAyMmE3IDcgMCAwIDEgNCAyIDggOCAwIDAgMSAyIDNsMjAtMjFhNyA3IDAgMCAwIDEgMSA0IDQgMCAwIDAgNCAwYzEtMSA2IDMgNyA0aC0xYTMgMyAwIDAgMCAwIDQgMiAyIDAgMCAwIDQgMGw2LTZhMyAzIDAgMCAwIDAtM3oiIGZpbGw9IiMyZTk2ZWYiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg%3D%3D)](https://github.com/WFCD/banner/blob/master/PROJECTS.md)
[![Discord](https://img.shields.io/discord/256087517353213954.svg?logo=discord)](https://discord.gg/jGZxH9f)

A Node.js library for querying Warframe item prices from the [Warframe.Market](https://warframe.market) API.

## Features

- 🔄 Support for both Warframe Market API v1 and v2
- 📊 Real-time price statistics (median, min, max, average)
- 👥 Live trader information with online status (v2)
- 🌍 Full internationalization support (12 languages)
- 🎮 Multi-platform support (PC, PlayStation, Xbox, Nintendo Switch)
- 💾 Smart caching with version-based invalidation
- 📱 Discord webhook integration ready

## Installation

```bash
npm install --save warframe-nexus-query
```

## Quick Start

```javascript
import PriceCheckQuerier from 'warframe-nexus-query';

const querier = new PriceCheckQuerier({ logger: console });

// Query item prices
const results = await querier.priceCheckQuery('loki prime', 'pc');
console.log(results);

// Get Discord-formatted attachments
const attachments = await querier.priceCheckQueryAttachment('ash prime systems', undefined, 'pc');
console.log(attachments);

// Clean up when done
await querier.stopUpdating();
```

## API

### Constructor

```javascript
const querier = new PriceCheckQuerier(options);
```

**Options:**

- `logger` - Logger instance (default: `console`)
- `marketCache` - Custom cache implementation (optional)
- `skipMarket` - Skip market data fetching (default: `false`)

### Methods

#### `priceCheckQuery(query, platform)`

Query item prices and return raw result objects.

**Parameters:**

- `query` (string) - Item name to search for
- `platform` (string) - Platform: `'pc'`, `'ps4'`, `'playstation'`, `'xb1'`, `'xbox'`, `'xbone'`, `'swi'`, `'switch'`, `'ns'`

**Returns:** `Promise<Array<Summary>>` - Array of price summary objects

```javascript
const results = await querier.priceCheckQuery('nova prime set', 'pc');
```

#### `priceCheckQueryString(query, platform)`

Query item prices and return formatted string.

**Parameters:**

- `query` (string) - Item name to search for
- `platform` (string) - Platform identifier

**Returns:** `Promise<string>` - Formatted price string

```javascript
const priceString = await querier.priceCheckQueryString('maiming strike', 'pc');
console.log(priceString); // "Maiming Strike: 150p (avg)"
```

#### `priceCheckQueryAttachment(query, priorResults, platform)`

Query item prices and return Discord-formatted embeds.

**Parameters:**

- `query` (string) - Item name to search for
- `priorResults` (Array|undefined) - Prior query results to use instead of fetching new data
- `platform` (string) - Platform identifier

**Returns:** `Promise<Array<Object>>` - Array of Discord embed objects

```javascript
const embeds = await querier.priceCheckQueryAttachment('condition overload', undefined, 'pc');
// Send embeds to Discord webhook
await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({ embeds }),
  headers: { 'Content-Type': 'application/json' },
});
```

#### `stopUpdating()`

Clean up resources and stop background updates.

```javascript
await querier.stopUpdating();
```

## Environment Variables

| Variable                      | Description              | Default   | Example                 |
| ----------------------------- | ------------------------ | --------- | ----------------------- |
| `WARFRAME_MARKET_API_VERSION` | API version to use       | `v1`      | `v2`                    |
| `MARKET_TIMEOUT`              | API request timeout (ms) | `30000`   | `60000`                 |
| `MARKET_CACHE_PATH`           | Cache directory path     | `./cache` | `/tmp/wf-cache`         |
| `MARKET_V2_URL_OVERRIDE`      | Custom v2 API base URL   | -         | `https://custom.api/v2` |

### API Version Selection

Switch between v1 and v2 APIs:

```bash
# Use v2 API (recommended)
WARFRAME_MARKET_API_VERSION=v2 node app.js

# Use v1 API (legacy)
WARFRAME_MARKET_API_VERSION=v1 node app.js
```

## API v2 Features

The v2 API includes enhanced features:

- **Version-based caching** - Automatic cache invalidation when items update
- **Real-time trader data** - See who's online and ready to trade
- **Trader activity** - View current in-game activity (mission, dojo, relay, etc.)
- **User reputation** - Trader reputation scores
- **Crossplay support** - Trade across platforms
- **Better performance** - Optimized endpoints for faster queries

### v2 Example Response

```javascript
{
  item: 'Ash Prime Systems',
  prices: {
    selling: { median: 15, average: 18.5, min: 10, max: 30 },
    buying: { median: 12, average: 11.8, min: 8, max: 15 }
  },
  traders: [
    {
      user: 'TraderName',
      platinum: 15,
      quantity: 3,
      status: 'online',
      reputation: 156,
      activity: 'In Dojo'
    }
  ]
}
```

## Platform Aliases

The following platform identifiers are supported:

| Platform        | Aliases                |
| --------------- | ---------------------- |
| PC              | `pc`                   |
| PlayStation     | `ps4`, `playstation`   |
| Xbox            | `xb1`, `xbox`, `xbone` |
| Nintendo Switch | `swi`, `switch`, `ns`  |

## Response Objects

### Summary Object

Result object returned by `priceCheckQuery()`:

```javascript
{
  type: 'market-v2',          // 'market' for v1, 'market-v2' for v2
  item: 'Item Name',
  platform: 'pc',
  componentName: 'Set',
  prices: {
    selling: {
      median: 100,
      average: 105.5,
      min: 80,
      max: 150,
      count: 25
    },
    buying: {
      median: 90,
      average: 88.2,
      min: 60,
      max: 95,
      count: 15
    }
  },
  traders: [                   // v2 only
    {
      user: 'Username',
      platinum: 100,
      quantity: 2,
      status: 'online',        // 'online' | 'ingame' | 'offline'
      reputation: 250,
      activity: 'On Mission'
    }
  ]
}
```

### Discord Embed Object

Result object returned by `priceCheckQueryAttachment()`:

```javascript
{
  title: 'Ash Prime Systems [PC]',
  url: 'https://warframe.market/items/ash_prime_systems',
  thumbnail: { url: 'https://warframe.market/static/assets/...' },
  color: 0x336699,
  fields: [
    {
      name: 'Selling',
      value: '💰 15p (median)\n📊 10-30p range\n📦 25 orders',
      inline: true
    },
    {
      name: 'Buying',
      value: '💰 12p (median)\n📊 8-15p range\n📦 15 orders',
      inline: true
    },
    {
      name: '🟢 Online Traders',
      value: 'TraderName: 15p x3'
    }
  ],
  footer: {
    text: 'Warframe Market • Updated 2 minutes ago'
  }
}
```

## Examples

### Basic Price Check

```javascript
import PriceCheckQuerier from 'warframe-nexus-query';

const querier = new PriceCheckQuerier({ logger: console });

// Search for an item
const results = await querier.priceCheckQuery('nikana prime', 'pc');

results.forEach((result) => {
  console.log(`${result.item} - ${result.componentName}`);
  console.log(`Median sell price: ${result.prices.selling.median}p`);
  console.log(`Median buy price: ${result.prices.buying.median}p`);
});

await querier.stopUpdating();
```

### Discord Bot Integration

```javascript
import PriceCheckQuerier from 'warframe-nexus-query';
import { Client, GatewayIntentBits } from 'discord.js';

const bot = new Client({ intents: [GatewayIntentBits.Guilds] });
const querier = new PriceCheckQuerier({ logger: console });

bot.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'price') {
    const item = interaction.options.getString('item');
    const platform = interaction.options.getString('platform') || 'pc';

    const embeds = await querier.priceCheckQueryAttachment(item, undefined, platform);

    if (embeds.length > 0) {
      await interaction.reply({ embeds });
    } else {
      await interaction.reply('No results found for that item.');
    }
  }
});

bot.login(process.env.DISCORD_TOKEN);
```

### Multi-Platform Price Comparison

```javascript
import PriceCheckQuerier from 'warframe-nexus-query';

const querier = new PriceCheckQuerier({ logger: console });
const platforms = ['pc', 'ps4', 'xbox', 'switch'];

for (const platform of platforms) {
  const results = await querier.priceCheckQuery('Trinity Prime Set', platform);

  if (results.length > 0) {
    const price = results[0].prices.selling.median;
    console.log(`${platform.toUpperCase()}: ${price}p`);
  }
}

await querier.stopUpdating();
```

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Generate coverage report
npm run coverage

# Generate API documentation
npm run build:docs
```

## Development

```bash
# Clone repository
git clone https://github.com/WFCD/warframe-nexus-query.git
cd warframe-nexus-query

# Install dependencies
npm install

# Run tests in watch mode
npm test -- --watch

# Lint and auto-fix
npm run lint:fix
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Links

- [GitHub Repository](https://github.com/WFCD/warframe-nexus-query)
- [npm Package](https://www.npmjs.com/package/warframe-nexus-query)
- [Warframe Market API](https://warframe.market)
- [Discord Community](https://discord.gg/jGZxH9f)
- [Warframe Community Developers](https://github.com/WFCD)

## Acknowledgments

- Built by the [Warframe Community Developers](https://github.com/WFCD)
- Powered by [Warframe.Market](https://warframe.market) API
- Maintained by [tobitenno](https://github.com/tobitenno) and contributors
