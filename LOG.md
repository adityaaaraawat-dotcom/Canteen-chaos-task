# Debug log

## CC-06 — "I ordered more than they had"

**Reproduced:** Submitted an order for a dish with a positive stock count,
requesting more servings than were left. The order passed validation because
the server only checked whether stock was zero.

**Cause:** Order validation did not compare the requested quantity with the
dish's remaining stock.

**Fix:** Reject quantities above the available stock during order validation,
and repeat the stock check when reserving stock so an invalid reservation
cannot reduce inventory below zero.

**Checked:** The smoke test checks that a request for one more serving than
the remaining stock returns HTTP 400. The existing stock reservation check
and ordering tests also run against a separate test server.

**Time:** Not recorded.

## CC-07 — "Cancelling makes it worse"

**Reproduced:** Compared a dish's stock before and after placing and
cancelling an order. Stock decreased again on cancellation instead of being
restored.

**Cause:** `releaseStock` subtracted the cancelled order quantity from the
available stock.

**Fix:** Add the cancelled quantity back to that dish's stock.

**Checked:** The smoke test checks that the stock count increases by one
after cancelling an order containing one serving.

**Time:** Not recorded.

## CC-08 — "An old coupon still works"

**Reproduced:** Quoted an eligible order using `FRESHERS24`, whose configured
expiry date is in 2024. The quote previously applied its discount.

**Cause:** Coupon pricing checked the usage count and order rules, but never
compared the coupon's expiry date with the current server time.

**Fix:** Reject expired coupons during pricing. Since both quotes and placed
orders use the same pricing function, the expiry rule applies to both.

**Checked:** The smoke test checks that the quote reports an error with no
discount and that trying to place an order with the expired coupon returns
HTTP 400.

**Time:** Not recorded.

## CC-09 — "The menu shows more dishes than it should"

**Reproduced:** Requested the menu with a page limit of five. The API
reported pagination metadata but returned dishes from the entire menu.

**Cause:** `paginate` calculated the requested page slice, but returned the
original full list instead.

**Fix:** Return the calculated slice as the page's `items`.

**Checked:** The smoke test checks that a five-item page has at most five
dishes and that two successive pages start with different dishes.

**Time:** Not recorded.

## CC-10 — "Sorting by price is backwards"

**Reproduced:** Requested the menu sorted by ascending price and observed
that prices decreased down the list. Descending order showed the reverse.

**Cause:** The ascending and descending price comparators were swapped.

**Fix:** Make ascending sort by `a.price - b.price` and descending by
`b.price - a.price`.

**Checked:** The smoke test checks that the ascending results never decrease
and descending results never increase.

**Time:** Not recorded.
