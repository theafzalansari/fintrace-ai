/**
 * Pure TypeScript Isolation Forest (iForest) Anomaly Detection Engine.
 * Implements random feature partitioning and BST depth path length calculation
 * to compute unsupervised anomaly scores (0.0 to 1.0) without external native dependencies.
 */

export interface IsolationNode {
  splitAttribute?: number;
  splitValue?: number;
  left?: IsolationNode;
  right?: IsolationNode;
  size?: number; // Size of sample subset at leaf node
  isLeaf: boolean;
}

/**
 * Calculates average path length c(n) of unsuccessful searches in a Binary Search Tree (BST).
 * Euler-Mascheroni constant gamma = 0.5772156649
 */
export function calculateBSTAveragePathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const eulerGamma = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerGamma) - (2 * (n - 1)) / n;
}

export class IsolationForest {
  private numTrees: number;
  private subSampleSize: number;
  private trees: IsolationNode[] = [];
  private numFeatures: number = 0;

  constructor(numTrees: number = 50, subSampleSize: number = 64) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
  }

  /**
   * Trains the Isolation Forest model using feature matrix X.
   * X is an array of numeric feature vectors, e.g. number[][]
   */
  public fit(X: number[][]): void {
    if (!X || X.length === 0) return;

    this.numFeatures = X[0].length;
    this.trees = [];

    const sampleSize = Math.min(this.subSampleSize, X.length);
    const maxDepth = Math.ceil(Math.log2(Math.max(2, sampleSize)));

    for (let i = 0; i < this.numTrees; i++) {
      // Draw random subsample without replacement
      const sample = this.getRandomSubsample(X, sampleSize);
      const tree = this.buildIsolationTree(sample, 0, maxDepth);
      this.trees.push(tree);
    }
  }

  /**
   * Recursively builds an Isolation Tree for sample subset.
   */
  private buildIsolationTree(data: number[][], currentDepth: number, maxDepth: number): IsolationNode {
    if (currentDepth >= maxDepth || data.length <= 1) {
      return { isLeaf: true, size: data.length };
    }

    // Check if all data points in current node are identical across all attributes
    let allIdentical = true;
    for (let col = 0; col < this.numFeatures; col++) {
      const firstVal = data[0][col];
      for (let row = 1; row < data.length; row++) {
        if (data[row][col] !== firstVal) {
          allIdentical = false;
          break;
        }
      }
      if (!allIdentical) break;
    }

    if (allIdentical) {
      return { isLeaf: true, size: data.length };
    }

    // Pick a random attribute column with varying values
    const validCols: number[] = [];
    for (let col = 0; col < this.numFeatures; col++) {
      let min = Infinity;
      let max = -Infinity;
      for (const row of data) {
        if (row[col] < min) min = row[col];
        if (row[col] > max) max = row[col];
      }
      if (min < max) {
        validCols.push(col);
      }
    }

    if (validCols.length === 0) {
      return { isLeaf: true, size: data.length };
    }

    const splitAttribute = validCols[Math.floor(Math.random() * validCols.length)];

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of data) {
      const v = row[splitAttribute];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    // Pick random split point between minVal and maxVal
    const splitValue = minVal + Math.random() * (maxVal - minVal);

    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (const row of data) {
      if (row[splitAttribute] < splitValue) {
        leftData.push(row);
      } else {
        rightData.push(row);
      }
    }

    return {
      isLeaf: false,
      splitAttribute,
      splitValue,
      left: this.buildIsolationTree(leftData, currentDepth + 1, maxDepth),
      right: this.buildIsolationTree(rightData, currentDepth + 1, maxDepth)
    };
  }

  /**
   * Computes path length h(x) for single data vector x in tree node.
   */
  private computePathLength(x: number[], node: IsolationNode, currentPathLength: number): number {
    if (node.isLeaf) {
      return currentPathLength + calculateBSTAveragePathLength(node.size || 1);
    }

    const attr = node.splitAttribute!;
    const val = node.splitValue!;

    if (x[attr] < val) {
      return this.computePathLength(x, node.left!, currentPathLength + 1);
    } else {
      return this.computePathLength(x, node.right!, currentPathLength + 1);
    }
  }

  /**
   * Computes anomaly score s(x, n) for feature vector x.
   * Returns score between 0.0 (normal) and 1.0 (highly anomalous).
   */
  public predictScore(x: number[], datasetSize?: number): number {
    if (this.trees.length === 0) return 0.0;

    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += this.computePathLength(x, tree, 0);
    }

    const meanPathLength = totalPathLength / this.trees.length;
    const n = datasetSize || this.subSampleSize;
    const cN = calculateBSTAveragePathLength(n);

    if (cN === 0) return 0.5;

    // s(x, n) = 2^(- E(h(x)) / c(n))
    const anomalyScore = Math.pow(2, -meanPathLength / cN);
    return Math.min(1.0, Math.max(0.0, anomalyScore));
  }

  /**
   * Predicts anomaly scores for a dataset batch X.
   */
  public predictBatch(X: number[][]): number[] {
    return X.map((x) => this.predictScore(x, X.length));
  }

  /**
   * Helper to sample subset without replacement.
   */
  private getRandomSubsample(X: number[][], sampleSize: number): number[][] {
    const indices = Array.from({ length: X.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, sampleSize).map((idx) => X[idx]);
  }
}
