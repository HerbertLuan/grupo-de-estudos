import test from 'node:test';
import assert from 'node:assert/strict';
import { monthDays, shiftMonth, dayState, countCompleted, fullDate } from '../src/components/streak/calendarDates.ts';
import { promptKey, wasPresented, recordPresentation, canPresent } from '../src/components/streak/dailyPrompt.ts';

test('calendar covers four, five and six rows and leap years', () => {
  assert.equal(monthDays('2026-02').length, 28);
  assert.equal(monthDays('2026-09').length, 35);
  assert.equal(monthDays('2026-08').length, 42);
  assert.ok(monthDays('2024-02').includes('2024-02-29'));
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.match(fullDate('2026-09-01'), /1 de setembro de 2026/);
});

test('only a confirmed point completes a day', () => {
  const partial = { date: '2026-09-22', totalSeconds: 3500, pointEarned: false };
  const completed = { date: '2026-09-23', totalSeconds: 3600, pointEarned: true };
  assert.equal(dayState(partial.date, '2026-09-25', partial), 'partial');
  assert.equal(dayState(completed.date, '2026-09-25', completed), 'completed');
  assert.equal(dayState('2026-09-24', '2026-09-25'), 'empty');
  assert.equal(dayState('2026-09-26', '2026-09-25'), 'future');
  assert.equal(countCompleted('2026-09', [partial, completed, { ...completed, date: '2026-08-31' }]), 1);
});

test('daily presentation is independent per project and account and survives reload', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const a = promptKey('project-a', 'user-a');
  const b = promptKey('project-a', 'user-b');
  const otherProject = promptKey('project-b', 'user-a');
  recordPresentation(a, '2026-09-25', storage);
  assert.equal(wasPresented(a, '2026-09-25', storage), true);
  assert.equal(wasPresented(a, '2026-09-26', storage), false);
  assert.equal(wasPresented(b, '2026-09-25', storage), false);
  assert.equal(wasPresented(otherProject, '2026-09-25', storage), false);
  assert.equal(canPresent('2026-09-25', false, true, false), true);
  assert.equal(canPresent('2026-09-25', false, true, true), false);
});

test('storage failures keep presentation control in memory', () => {
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const key = promptKey('project', 'blocked-storage-user');
  assert.equal(wasPresented(key, '2026-09-25', broken), false);
  recordPresentation(key, '2026-09-25', broken);
  assert.equal(wasPresented(key, '2026-09-25', broken), true);
});
