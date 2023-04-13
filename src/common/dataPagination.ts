export const getdataWithPagination = async (data: any, req: any) => {
  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / 5);
  const currentPage =
    req && req.query && req.query.page ? parseInt(req.query.page) : 1;

  const startIndex = (currentPage - 1) * 5;
  const endIndex = startIndex + 5;
  const dataPerPage = data.slice(startIndex, endIndex);

  const response = {
    totalRecords,
    totalPages,
    currentPage,
    data: dataPerPage,
  };

  return response;
};
