# Bug Fix Summary
I've fixed five out of the ten bugs assigned to me: CC-06 through CC-10. The remaining five (CC-01 through CC-05) haven't been touched yet as part of this sprint.
(I've used AI to enhance the document quality)
## CC-06 - Orders could exceed available stock

**Problem:** An order could request more servings than were left, as long as
the dish had at least one serving in stock.

**Solution:** Order validation now compares the requested quantity with the
dish's current stock. Stock reservation repeats the check before subtracting,
so the reservation itself cannot take stock below zero.

**Files:** `backend/logic/validation.js`, `backend/smoke.js`

**Check:** The smoke test now verifies that ordering one serving more than
available is rejected. It also covers the normal order and stock-reservation
flow.

## CC-07 - Cancelling an order reduced stock

**Problem:** The stock restoration helper subtracted the cancelled quantity,
making the recorded stock even lower.

**Solution:** Cancellation now adds the cancelled quantity back to the dish's
stock.

**Files:** `backend/logic/validation.js`

**Check:** The smoke test places and cancels an order, then checks that stock
increased by the quantity cancelled.

## CC-08 - Expired coupons could be used

**Problem:** Coupon pricing checked use limits and order rules but did not
check the coupon expiry date.

**Solution:** Coupon pricing parses `expiresAt` and rejects coupons that have
expired (or have an invalid expiry date). Quotes and order placement both use
this pricing logic.

**Files:** `backend/logic/pricing.js`, `backend/smoke.js`

**Check:** The smoke test verifies that an expired coupon gives no quote
discount and that an order using it is rejected.

## CC-09 - Pagination returned the full menu

**Problem:** The API calculated the selected page's slice but returned the
entire list instead, so the frontend could append the same dishes again as a
person scrolled.

**Solution:** The pagination helper now returns only the selected page's
slice. The API still reports the total number of matching dishes and whether
another page exists.

**Files:** `backend/logic/search.js`, `backend/smoke.js`

**Check:** The smoke test checks that a page with a limit of five contains at
most five dishes and that the first dishes on successive pages differ.
Manual browser verification showed 37 dishes loaded in total with 37 unique
dish IDs; the last page contains the remaining two dishes.

## CC-10 - Price sort directions were reversed

**Problem:** The comparator for ascending price sorted high-to-low, and the
descending comparator sorted low-to-high.

**Solution:** Ascending sort now compares `a.price - b.price`; descending
sort compares `b.price - a.price`.

**Files:** `backend/logic/search.js`, `backend/smoke.js`

**Check:** Smoke tests verify that ascending prices never decrease and
descending prices never increase.

## Verification notes

All targeted logic checks passed perfectly. The end 2 end smoke test successfully verified pagination, price sorting, expired coupon rejection, stock limits, and cancellations.

Just a heads up: five unrelated smoke tests are still failing because orders can't currently transition from ready to picked.This is also blocking the history and rating checks from completing. That's a separate issue and wasn't part of the scope for these five fixes.
