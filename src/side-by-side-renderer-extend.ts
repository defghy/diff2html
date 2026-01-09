import HoganJsUtils from './hoganjs-utils';
import * as Rematch from './rematch';
import * as renderUtils from './render-utils';
import { DiffLine, LineRenderRaw, DiffFile } from './types';
import SideBySideRenderer, { SideBySideRendererConfig } from './side-by-side-renderer';

export default class SideBySideExRenderer extends SideBySideRenderer {
  constructor(hoganUtils: HoganJsUtils, config: SideBySideRendererConfig = {}) {
    super(hoganUtils, config);
  }

  createHtmlLines = (diffFile: DiffFile): { leftLines: string[]; rightLines: string[] } => {
    const { isCombined } = diffFile;
    const matcher = Rematch.newMatcherFn(
      Rematch.newDistanceFn((e: any) => renderUtils.deconstructLine(e.content, isCombined).content),
    );
    let leftLines: string[] = [];
    let rightLines: string[] = [];

    if (diffFile.blocks.length) {
      diffFile.blocks.forEach(block => {
        leftLines.push(this.makeHeaderHtml(block.header, diffFile));
        rightLines.push(this.makeHeaderHtml(''));
        this.applyLineGroupping(block).forEach(([contextLines, oldLines, newLines]) => {
          if (oldLines.length && newLines.length && !contextLines.length) {
            this.applyRematchMatching(oldLines, newLines, matcher).map(([oldLines, newLines]) => {
              const { left, right } = this.createChangedLines(isCombined, oldLines, newLines);
              leftLines = leftLines.concat(left);
              rightLines = rightLines.concat(right);
            });
          } else if (contextLines.length) {
            contextLines.forEach(line => {
              const { prefix, content } = renderUtils.deconstructLine(line.content, diffFile.isCombined);
              const { left, right } = this.generateLineHtml(
                {
                  type: renderUtils.CSSLineClass.CONTEXT,
                  prefix: prefix,
                  content: content,
                  number: line.oldNumber,
                },
                {
                  type: renderUtils.CSSLineClass.CONTEXT,
                  prefix: prefix,
                  content: content,
                  number: line.newNumber,
                },
              );
              leftLines.push(left);
              rightLines.push(right);
            });
          } else if (oldLines.length || newLines.length) {
            const { left, right } = this.createChangedLines(isCombined, oldLines, newLines);
            leftLines = leftLines.concat(left);
            rightLines = rightLines.concat(right);
          } else {
            console.error('Unknown state reached while processing groups of lines', contextLines, oldLines, newLines);
          }
        });
      });
    } else {
      leftLines.push(this.generateEmptyDiff().left);
      rightLines.push('');
    }
    return {
      leftLines,
      rightLines,
    };
  };

  createRenderLines = (
    diffFile: DiffFile,
  ): { leftLines: LineRenderRaw[]; rightLines: LineRenderRaw[]; renderLine: (item: LineRenderRaw) => string } => {
    const { isCombined } = diffFile;
    const matcher = Rematch.newMatcherFn(
      Rematch.newDistanceFn((e: any) => renderUtils.deconstructLine(e.content, isCombined).content),
    );
    const leftLines: LineRenderRaw[] = [];
    const rightLines: LineRenderRaw[] = [];

    if (diffFile.blocks.length) {
      diffFile.blocks.forEach(block => {
        leftLines.push({ renderBy: 'header', data: block.header });
        rightLines.push({ renderBy: 'header', data: '' });
        this.applyLineGroupping(block).forEach(([contextLines, oldLines, newLines]) => {
          if (oldLines.length && newLines.length && !contextLines.length) {
            this.applyRematchMatching(oldLines, newLines, matcher).map(([oldLines, newLines]) => {
              oldLines;
              newLines;
              // const { left, right } = this.processChangedLines(isCombined, oldLines, newLines);
              // fileHtml.left += left;
              // fileHtml.right += right;
            });
          }
        });
      });
    } else {
      leftLines.push({ renderBy: 'empty' });
    }
    return {
      leftLines,
      rightLines,
      renderLine: item => this.renderLine({ item, file: diffFile }),
    };
  };

  createChangedLines(
    isCombined: boolean,
    oldLines: DiffLine[],
    newLines: DiffLine[],
  ): { left: string[]; right: string[] } {
    const fileHtml = {
      right: [] as string[],
      left: [] as string[],
    };

    const maxLinesNumber = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLinesNumber; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      const diff =
        oldLine !== undefined && newLine !== undefined
          ? renderUtils.diffHighlight(oldLine.content, newLine.content, isCombined, this.config)
          : undefined;

      const preparedOldLine =
        oldLine !== undefined && oldLine.oldNumber !== undefined
          ? {
              ...(diff !== undefined
                ? {
                    prefix: diff.oldLine.prefix,
                    content: diff.oldLine.content,
                    type: renderUtils.CSSLineClass.DELETE_CHANGES,
                  }
                : {
                    ...renderUtils.deconstructLine(oldLine.content, isCombined),
                    type: renderUtils.toCSSClass(oldLine.type),
                  }),
              number: oldLine.oldNumber,
            }
          : undefined;

      const preparedNewLine =
        newLine !== undefined && newLine.newNumber !== undefined
          ? {
              ...(diff !== undefined
                ? {
                    prefix: diff.newLine.prefix,
                    content: diff.newLine.content,
                    type: renderUtils.CSSLineClass.INSERT_CHANGES,
                  }
                : {
                    ...renderUtils.deconstructLine(newLine.content, isCombined),
                    type: renderUtils.toCSSClass(newLine.type),
                  }),
              number: newLine.newNumber,
            }
          : undefined;

      const { left, right } = this.generateLineHtml(preparedOldLine, preparedNewLine);
      fileHtml.left.push(left);
      fileHtml.right.push(right);
    }

    return fileHtml;
  }

  renderLine({ item, file }: { item: LineRenderRaw; file: DiffFile }) {
    item;
    file;
    return '';
  }
}
