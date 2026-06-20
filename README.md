# Citizen Nexus

---

An MCP server that fetches data from the Star Citizen wiki and UEX.

## Description

---

This project is an [MCP server](https://modelcontextprotocol.io/docs/getting-started/intro) that gathers data
from the [Star Citizen Wiki](https://starcitizen.tools/) and [UEX](https://uexcorp.space/) via their respective APIs.
This will allow new and veteran
players to search for information like item and vehicle purchase locations, commodity prices, and more with their
favorite LLM. You can plug it into any LLM client that supports MCP servers, like Claude.

## ⚙️ Exposed tools

### `search_vehicles`

Find Star Citizen flight-ready ships and ground vehicles by name. Returns matching vehicles with key details (
manufacturer, classification, crew, cargo, quantum travel) and any in-game purchase or rental listings (terminals,
locations, UEC prices).

**Parameters:**

- `query` (string, required): Full or partial vehicle name, e.g. "Constellation" or "Drake Cutlass Black"

<details>
<summary>Prompt example</summary>

**Prompt:**

> Where can I rent the cutter for the cheapest?

**Reply:**

``` markdown
Cheapest rental for the Cutter (base):

| Price          | Location                                   |
|----------------|--------------------------------------------|
| **9,049 aUEC** | Traveler Rentals - Pyro Gateway (Stanton)  |
| 9,050 aUEC     | Traveler Rentals - Everus Harbor (Hurston) |
| 9,525 aUEC     | Most other Traveler Rentals terminals      |
| 15,083 aUEC    | Vantage Rentals - Lorville (avoid)         |

**Pyro Gateway (Stanton side)** is your cheapest option by a hair. The Cutter Scout and Rambler variants have no rental
listings currently.
```

</details>

## 📝 Requirements




## 📦 Installation

---

## Usage

---

## Support this project

---

If you find this tool useful, you can buy me a coffee 😊

<a href='https://ko-fi.com/J0V120R4A1' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
## 📌 Acknowledgements and disclaimers

---

This project uses data from the following community APIs:

**[UEX Corporation](https://uexcorp.space/):** Provides Star Citizen trade and market data. Use of this tool requires
your own UEX API key and compliance with the [UEX Terms of Service](https://uexcorp.space/about/terms).

**[Star Citizen Wiki API](https://api.star-citizen.wiki):** Star Citizen general game data. Use of this tool requires
compliance with their [usage terms](https://api.star-citizen.wiki/developers).

<img src="doc/assets/MadeByTheCommunity_White.png" width="150" height="150">

**This is a fan-made tool and is not affiliated with or endorsed by Cloud Imperium Games or Roberts Space Industries.
Star
Citizen®, Roberts Space Industries®, and Cloud Imperium® are registered trademarks of Cloud Imperium Rights LLC and
Cloud Imperium Rights Ltd.**

**Commercial use is not permitted under
the [RSI Fandom FAQ](https://support.robertsspaceindustries.com/hc/en-us/articles/360006895793-Star-Citizen-Fankit-and-Fandom-FAQ).
**
