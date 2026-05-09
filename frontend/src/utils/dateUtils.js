export const formatDate = (date) => {
   if (!date) return "N/A";
   const d = new Date(date);
   if (isNaN(d.getTime())) return "Invalid";
   const day = String(d.getDate()).padStart(2, '0');
   const month = String(d.getMonth() + 1).padStart(2, '0');
   const year = d.getFullYear();
   return `${day}-${month}-${year}`;
};

export const formatMonth = (date) => {
   const d = new Date(date);
   if (isNaN(d.getTime())) return "Invalid";
   return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
};
