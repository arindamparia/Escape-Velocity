#!/usr/bin/env python3
"""Moves the plan to a new start date: the front matter, every week heading and the "At a glance" table are rewritten from
the start date (the plan's days are Mon to Sun, so the start must be a Monday). Festival wording is edited by hand.

    python3 scripts/set-start.py 2026-10-26
"""
import datetime as dt
import re
import sys

start = dt.date.fromisoformat(sys.argv[1])
if start.weekday() != 0:
    sys.exit(f'{start} is a {start.strftime("%A")}: the plan weeks run Monday to Sunday, so the start must be a Monday.')
path = 'plan/escape-velocity-plan.md'
text = open(path).read()
MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
end = start + dt.timedelta(days=13 * 7 - 1)
apply_from = end + dt.timedelta(days=1)


def rng(a: dt.date, b: dt.date) -> str:
    return f'{a.day} to {b.day} {MON[b.month - 1]}' if a.month == b.month else f'{a.day} {MON[a.month - 1]} to {b.day} {MON[b.month - 1]}'


def week(n: int) -> str:
    a = start + dt.timedelta(days=(n - 1) * 7)
    return rng(a, a + dt.timedelta(days=6))


text = re.sub(r'^start_date: .*$', f'start_date: {start}', text, flags=re.M)
text = re.sub(r'^end_date: .*$', f'end_date: {end}', text, flags=re.M)
text = re.sub(r'^applications_from: .*$', f'applications_from: {apply_from}', text, flags=re.M)
text = re.sub(r'(### Week (\d\d) · )[^·]+( · )', lambda m: f'{m.group(1)}{week(int(m.group(2)))}{m.group(3)}', text)
# only the "At a glance" table: its rows follow the header "| Week | Dates | Theme | Saturday design |"
head = '| Week | Dates | Theme | Saturday design |'
i = text.index(head)
lines = text[i:].split('\n')
out, inside = [], False
for ln in lines:
    if ln.startswith(head): inside = True
    elif inside and re.match(r'^\| (\d+) \| ', ln) and 1 <= int(ln.split('|')[1]) <= 13:
        cells = ln.split('|')
        cells[2] = f' {week(int(cells[1]))} '
        ln = '|'.join(cells)
    elif inside and not ln.startswith('|'):
        inside = False
    out.append(ln)
text = text[:i] + '\n'.join(out)
open(path, 'w').write(text)
print(f'start {start} ({start.strftime("%A")}), end {end}, applications from {apply_from}')
