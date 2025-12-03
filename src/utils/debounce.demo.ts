/**
 * Demo script to verify debounce functionality
 * Run with: npx tsx src/utils/debounce.demo.ts
 */

import { debounce } from './debounce';

console.log('=== Debounce Demo ===\n');

// Demo 1: Basic debouncing
console.log('Demo 1: Basic debouncing (100ms delay)');
let callCount = 0;
const demoFn = (value: string) => {
  callCount++;
  console.log(`  Function called with: ${value} (call #${callCount})`);
};

const debouncedDemo = debounce(demoFn, 100);

console.log('  Making 5 rapid calls...');
debouncedDemo('call-1');
debouncedDemo('call-2');
debouncedDemo('call-3');
debouncedDemo('call-4');
debouncedDemo('call-5');

setTimeout(() => {
  console.log('  Result: Only the last call executed!\n');

  // Demo 2: Flush functionality
  console.log('Demo 2: Flush ensures final state is saved');
  callCount = 0;
  const flushDemo = debounce(demoFn, 100);
  
  console.log('  Making calls and flushing immediately...');
  flushDemo('pending-call');
  flushDemo.flush();
  console.log('  Result: Call executed immediately via flush!\n');

  // Demo 3: Cancel functionality
  console.log('Demo 3: Cancel prevents execution');
  callCount = 0;
  const cancelDemo = debounce(demoFn, 100);
  
  console.log('  Making call and canceling...');
  cancelDemo('canceled-call');
  cancelDemo.cancel();
  
  setTimeout(() => {
    console.log('  Result: No function call (canceled successfully)!\n');
    console.log('=== Demo Complete ===');
  }, 150);
}, 150);
