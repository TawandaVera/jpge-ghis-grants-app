// Plain-language labels for funding recommendations.
// Underlying data values stay GO/PREP/DEF/DECLINE for business logic;
// these are only for display so the app is easy for anyone to understand.

export const REC_LABEL = {
  GO: "Great Fit",
  PREP: "Worth a Look",
  DEF: "Maybe Later",
  DECLINE: "Skip",
};

export const recLabel = (rec) => REC_LABEL[rec] || rec || "Not scored yet";