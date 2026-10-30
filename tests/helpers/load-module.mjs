import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Load the same TypeScript/JSON modules Next bundles, without a backend or custom Node loader.
const modules = new Map();
export function loadModule(url) {
  function compile(file) {
    if (modules.has(file.href)) return modules.get(file.href);
    const source = readFileSync(file, "utf8");
    let js = file.pathname.endsWith(".json")
      ? `export default ${source};`
      : ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
          fileName: fileURLToPath(file),
        }).outputText;
    const ast = ts.createSourceFile("module.js", js, ts.ScriptTarget.Latest, true);
    for (const statement of [...ast.statements].reverse()) {
      if (!ts.isImportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier.text.startsWith(".") && !specifier.text.startsWith("@/")) throw new Error(`Unexpected runtime dependency: ${specifier.text}`);
      const target = specifier.text.startsWith("@/")
        ? new URL(`../../src/${specifier.text.slice(2)}`, import.meta.url)
        : new URL(specifier.text, file);
      if (!/\.(?:json|ts|tsx)$/.test(target.pathname)) target.pathname += ".ts";
      js = js.slice(0, specifier.getStart(ast)) + JSON.stringify(compile(target)) + js.slice(specifier.end);
    }
    const result = `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`;
    modules.set(file.href, result);
    return result;
  }
  return import(compile(url));
}
