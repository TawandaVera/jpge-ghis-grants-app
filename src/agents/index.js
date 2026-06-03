/**
 * Agent Registry & Orchestration
 * Central export for all agents (Layer 1 & Layer 2)
 */
import SignalClassifier from './layer1_decision/SignalClassifier';
import Screener from './layer1_decision/Screener';
import ReadinessValidator from './layer1_decision/ReadinessValidator';
import DecisionReviewer from './layer1_decision/DecisionReviewer';
import PackArchitect from './layer1_decision/PackArchitect';

import GrantDiscoveryAgent from './layer2_operations/GrantDiscoveryAgent';
import DataExtractor from './layer2_operations/DataExtractor';
import WritingAgent from './layer2_operations/WritingAgent';
import BudgetBuilder from './layer2_operations/BudgetBuilder';
import ComplianceChecker from './layer2_operations/ComplianceChecker';
import ReviewSimulator from './layer2_operations/ReviewSimulator';
import DeadlineAgent from './layer2_operations/DeadlineAgent';
import GrantPackagingAgent from './layer2_operations/GrantPackagingAgent';
import GrantAssessmentAgent from './layer2_operations/GrantAssessmentAgent';
import GrantDiscoveryToPackAgent from './layer2_operations/GrantDiscoveryToPackAgent';

import MasterOrchestrator from './MasterOrchestrator';

export const layer1Agents = {
  signalClassifier: SignalClassifier,
  screener: Screener,
  readinessValidator: ReadinessValidator,
  decisionReviewer: DecisionReviewer,
  packArchitect: PackArchitect,
};

export const layer2Agents = {
  grantDiscoveryAgent: GrantDiscoveryAgent,
  dataExtractor: DataExtractor,
  writingAgent: WritingAgent,
  budgetBuilder: BudgetBuilder,
  complianceChecker: ComplianceChecker,
  reviewSimulator: ReviewSimulator,
  deadlineAgent: DeadlineAgent,
  grantPackagingAgent: GrantPackagingAgent,
  grantAssessmentAgent: GrantAssessmentAgent,
  grantDiscoveryToPackAgent: GrantDiscoveryToPackAgent,
};

export { MasterOrchestrator };
export {
  SignalClassifier,
  Screener,
  ReadinessValidator,
  DecisionReviewer,
  PackArchitect,
  GrantDiscoveryAgent,
  DataExtractor,
  WritingAgent,
  BudgetBuilder,
  ComplianceChecker,
  ReviewSimulator,
  DeadlineAgent,
  GrantPackagingAgent,
  GrantAssessmentAgent,
  GrantDiscoveryToPackAgent,
};
