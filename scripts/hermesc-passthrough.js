/**
 * Stand-in for `hermesc`, used only when building with `-PskipHermesc`.
 *
 * The React Native Gradle plugin calls the Hermes compiler as:
 *   hermesc -w -emit-binary -max-diagnostic-width=80 -out <bundle.hbc> <bundle.js> [flags]
 * and then moves <bundle.hbc> over <bundle.js>. Copying the JS source to the
 * output path leaves a plain-JS bundle in the APK, which the Hermes runtime
 * compiles when the app starts.
 */
const fs = require('fs');

const args = process.argv.slice(2);
const outIndex = args.indexOf('-out');

if (outIndex === -1 || outIndex + 1 >= args.length) {
  console.error('hermesc-passthrough: missing -out <file>');
  process.exit(2);
}

const output = args[outIndex + 1];
const input = args.slice(outIndex + 2).find(arg => !arg.startsWith('-'));

if (!input || !fs.existsSync(input)) {
  console.error(`hermesc-passthrough: input bundle not found: ${input}`);
  process.exit(2);
}

fs.copyFileSync(input, output);
console.log(`hermesc-passthrough: copied ${input} -> ${output} (plain JS, no bytecode)`);
