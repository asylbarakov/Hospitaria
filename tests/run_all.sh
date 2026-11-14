#!/bin/sh
# Прогон всех node-тестов (без браузера): sh tests/run_all.sh
cd "$(dirname "$0")" || exit 1
fail=0
for t in iso_unit iso_scene_test layout_test walk_test depth_layout_test hospital_scene_test; do
  printf '%s: ' "$t"
  node "$t.mjs" > /tmp/hosp_test.log 2>&1 && tail -1 /tmp/hosp_test.log || { echo FAIL; cat /tmp/hosp_test.log; fail=1; }
done
exit $fail
