#!/bin/sh
# Passes when every listed verification file has no unchecked box and no FAIL.
status=0
for f in "$@"; do
  if grep -nE '\[ \]|FAIL' "$f"; then status=1; fi
done
exit $status
