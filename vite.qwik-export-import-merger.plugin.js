import * as acorn from "acorn";
import escodegen from "escodegen";
import * as walk from "acorn-walk";

class QwikExportImportMerger {
  constructor() {
    this.qwikImportNode = null;
    this.qwikExportNode = null;
    this.namedExportNode = null;
    this.exportedFromQwik = [];
    this.hasNamedExports = false;
  }

  processCode(code) {
    const ast = acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: 2022,
      locations: true,
    });

    this.reset();

    this.findRelevantNodes(ast);

    if (!this.qwikImportNode || !this.qwikExportNode) {
      return;
    }

    this.transformAST(ast);

    try {
      return escodegen.generate(ast, {
        format: {
          indent: { style: "  " },
          quotes: "single",
        },
      });
    } catch (e) {
      return undefined;
    }
  }

  reset() {
    this.qwikImportNode = null;
    this.qwikExportNode = null;
    this.namedExportNode = null;
    this.exportedFromQwik = [];
    this.hasNamedExports = false;
  }

  findRelevantNodes(ast) {
    walk.simple(ast, {
      ImportDeclaration: (node) => {
        if (node.source.value === "@builder.io/qwik") {
          this.qwikImportNode = node;
        }
      },

      ExportNamedDeclaration: (node) => {
        if (node.source && node.source.value === "@builder.io/qwik") {
          this.qwikExportNode = node;
          node.specifiers.forEach((spec) => {
            if (spec.type === "ExportSpecifier") {
              this.exportedFromQwik.push({
                local: spec.local.name,
                exported: spec.exported.name,
              });
            }
          });
        }
        else if (!node.source && node.specifiers.length > 0) {
          this.namedExportNode = node;
          this.hasNamedExports = true;
        }
      },
    });
  }

  transformAST(ast) {
    this.mergeExportsToImport();

    this.removeQwikExport(ast);

    this.handleNamedExports(ast);
  }

  mergeExportsToImport() {
    const existingImports = new Set();

    this.qwikImportNode.specifiers.forEach((spec) => {
      if (spec.type === "ImportSpecifier") {
        existingImports.add(spec.imported.name);
      }
    });

    this.exportedFromQwik.forEach((exportItem) => {
      if (!existingImports.has(exportItem.local)) {
        const newImportSpec = {
          type: "ImportSpecifier",
          imported: {
            type: "Identifier",
            name: exportItem.local,
          },
          local: {
            type: "Identifier",
            name: exportItem.local,
          },
        };
        this.qwikImportNode.specifiers.push(newImportSpec);
      }
    });
  }

  removeQwikExport(ast) {
    const index = ast.body.indexOf(this.qwikExportNode);
    if (index !== -1) {
      ast.body.splice(index, 1);
    }
  }

  handleNamedExports(ast) {
    const exportSpecifiers = this.exportedFromQwik.map((exportItem) => ({
      type: "ExportSpecifier",
      local: {
        type: "Identifier",
        name: exportItem.local,
      },
      exported: {
        type: "Identifier",
        name: exportItem.exported,
      },
    }));

    if (this.hasNamedExports && this.namedExportNode) {
      this.namedExportNode.specifiers.push(...exportSpecifiers);
    } else {
      const newNamedExport = {
        type: "ExportNamedDeclaration",
        declaration: null,
        specifiers: exportSpecifiers,
        source: null,
      };
      ast.body.push(newNamedExport);
    }
  }
}

export function processQwikExports(code) {
  const processor = new QwikExportImportMerger();
  return processor.processCode(code);
}

export function viteQwikExportMerger(external = ["@builder.io/qwik"]) {
  return {
    name: "qwik-export-merger",
    confing: () => ({
      build: {
        rollupOptions: {
          external,
          plugins: [
            {
              name: "debug",
              renderChunk(code, chunk) {
                const { ext } = path.parse(chunk.fileName);

                if (ext === ".js") {
                  return processQwikExports(code);
                }
              },
            },
          ],
        },
      },
    }),
  };
}
