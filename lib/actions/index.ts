/**
 * Server Actions Index
 * Re-exports all server actions for convenient imports
 */

// Account actions
export {
  getAccounts,
  getAccountSummary,
  getAccountById,
  createAccount,
  updateAccount,
  updateAccountBalance,
  deleteAccount,
} from './accounts';

// Category actions
export {
  getCategories,
  getCategoryTree,
  getCategoryTreeSimple,
  getCategoryById,
  getParentCategories,
  getChildCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  ensureDefaultCategories,
} from './categories';

// Transaction actions
export {
  getTransactions,
  getTransactionsWithRelations,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getRecentTransactions,
} from './transactions';
