// utils/generateData.ts
export const generateData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    const height = Math.floor(30 + Math.random() * 200);
    data.push({
      id: i,
      text: `Item ${i} - Height: ${height}px`,
      height,
    });
  }
  return data;
};
