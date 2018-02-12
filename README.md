git clone
cd
npm install
npm start


Scans all crypto markets, calculates indicators and bar patterns for each crypto.
If bullish indicator/pattern found then a score of +1 is applied.
If bearish then a score of -1 is applied.

User tells bot, Stop Loss percentage, Take profit percentage and score to act on.

Bot runs on 5m, 30m, 1h, 1d

ie: SL = 5%, TP = 10%, SCORE=2, Time = 1hr
bot will open a order with stop loss and tp for the coin that score matches.


http://bullorbear.io