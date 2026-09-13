exports.transactionNumber = (number) => `TRX-${String(number).padStart(6, "0")}`;
