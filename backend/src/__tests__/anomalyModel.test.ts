import { describe, it } from 'node:test';
import assert from 'node:assert';
import { featureExtractor } from '../services/ml-anomaly/anomalyFeatureExtractor.js';
import { IsolationForest, calculateBSTAveragePathLength } from '../services/ml-anomaly/isolationForest.js';
import { syntheticGenerator } from '../services/ml-anomaly/syntheticDatasetGenerator.js';

describe('In-House Isolation Forest ML Anomaly Engine', () => {
  describe('BST Average Path Length Formula', () => {
    it('should compute BST average path lengths c(n) correctly', () => {
      assert.strictEqual(calculateBSTAveragePathLength(0), 0);
      assert.strictEqual(calculateBSTAveragePathLength(1), 0);
      assert.strictEqual(calculateBSTAveragePathLength(2), 1);
      assert.ok(calculateBSTAveragePathLength(64) > 5.0);
    });
  });

  describe('Feature Extractor', () => {
    it('should extract 6D numeric feature vectors for raw records', () => {
      const beneficiaries = [
        { beneficiaryId: 'BEN-1', bankAccountNumber: '12345678' },
        { beneficiaryId: 'BEN-2', bankAccountNumber: '12345678' } // shared account
      ];
      const disbursements = [
        { disbursementId: 'D1', beneficiaryId: 'BEN-1', amount: 50000, status: 'Completed' },
        { disbursementId: 'D2', beneficiaryId: 'BEN-1', amount: 150000, status: 'Failed' }
      ];
      const edges = [
        { source: 'BEN-1', target: 'BEN-2', relation: 'SHARED_BANK_ACCOUNT' }
      ];

      const vectors = featureExtractor.extractFeatures(beneficiaries, disbursements, edges);
      assert.strictEqual(vectors.length, 2);

      const ben1Vector = vectors.find((v) => v.beneficiaryId === 'BEN-1');
      assert.ok(ben1Vector);
      assert.strictEqual(ben1Vector.degreeCentrality, 1);
      assert.strictEqual(ben1Vector.sharedAccountCount, 1);
      assert.strictEqual(ben1Vector.totalDisbursementAmount, 200000);
      assert.strictEqual(ben1Vector.disbursementCount, 2);
      assert.strictEqual(ben1Vector.maxSingleDisbursement, 150000);
      assert.strictEqual(ben1Vector.failedDisbursementRatio, 0.5);
    });
  });

  describe('Held-Out Test Set Isolation Forest Evaluation (No Leakage)', () => {
    it('should train on training split and accurately detect anomalies on held-out test split', () => {
      const dataset = syntheticGenerator.generateBenchmarkDataset();
      assert.strictEqual(dataset.beneficiaries.length, 250);

      // Extract scaled feature vectors
      const featureVectors = featureExtractor.extractFeatures(
        dataset.beneficiaries,
        dataset.disbursements,
        dataset.edges
      );

      // Separate into normal vs anomalous feature vectors
      const normalVectors = featureVectors.filter((v) => !dataset.anomalousEntityIds.has(v.beneficiaryId));
      const anomalyVectors = featureVectors.filter((v) => dataset.anomalousEntityIds.has(v.beneficiaryId));

      // 70% Train / 30% Held-Out Test split
      const trainNormalCount = Math.floor(normalVectors.length * 0.7);
      const trainAnomalyCount = Math.floor(anomalyVectors.length * 0.7);

      const trainVectors = [
        ...normalVectors.slice(0, trainNormalCount),
        ...anomalyVectors.slice(0, trainAnomalyCount)
      ];

      const heldOutTestVectors = [
        ...normalVectors.slice(trainNormalCount),
        ...anomalyVectors.slice(trainAnomalyCount)
      ];

      // Train model EXCLUSIVELY on training vectors (70% split)
      const trainX = trainVectors.map((v) => v.features);
      const model = new IsolationForest(100, 64);
      model.fit(trainX);

      // Predict scores EXCLUSIVELY on held-out test vectors (30% split)
      const testX = heldOutTestVectors.map((v) => v.features);

      let heldOutNormalScoreSum = 0;
      let heldOutNormalCount = 0;
      let heldOutAnomalyScoreSum = 0;
      let heldOutAnomalyCount = 0;

      let truePositives = 0;
      let falsePositives = 0;
      let trueNegatives = 0;
      let falseNegatives = 0;

      const threshold = 0.60;

      for (let i = 0; i < heldOutTestVectors.length; i++) {
        const fv = heldOutTestVectors[i];
        const isAnomaly = dataset.anomalousEntityIds.has(fv.beneficiaryId);
        const score = model.predictScore(testX[i]);

        assert.ok(score >= 0.0 && score <= 1.0, `Score ${score} out of bounds`);

        if (isAnomaly) {
          heldOutAnomalyScoreSum += score;
          heldOutAnomalyCount++;
          if (score >= threshold) truePositives++;
          else falseNegatives++;
        } else {
          heldOutNormalScoreSum += score;
          heldOutNormalCount++;
          if (score >= threshold) falsePositives++;
          else trueNegatives++;
        }
      }

      const avgHeldOutNormalScore = heldOutNormalScoreSum / heldOutNormalCount;
      const avgHeldOutAnomalyScore = heldOutAnomalyScoreSum / heldOutAnomalyCount;

      const precision = truePositives / (truePositives + falsePositives || 1);
      const recall = truePositives / (truePositives + falseNegatives || 1);
      const f1Score = (2 * precision * recall) / (precision + recall || 1);

      // Verify on held-out test set: Anomaly score for anomalous test entities is significantly higher than normal test entities
      assert.ok(
        avgHeldOutAnomalyScore > avgHeldOutNormalScore,
        `Expected held-out anomaly score (${avgHeldOutAnomalyScore.toFixed(3)}) > normal score (${avgHeldOutNormalScore.toFixed(3)})`
      );

      // High recall & precision on held-out synthetic test set
      assert.ok(recall >= 0.85, `Expected held-out recall >= 0.85, got ${recall.toFixed(2)}`);
      assert.ok(f1Score >= 0.85, `Expected held-out F1-Score >= 0.85, got ${f1Score.toFixed(2)}`);
    });

    it('should return safe default score for empty or identical feature inputs', () => {
      const model = new IsolationForest();
      model.fit([]);
      const score = model.predictScore([0, 0, 0, 0, 0, 0]);
      assert.strictEqual(score, 0.0);
    });
  });
});
