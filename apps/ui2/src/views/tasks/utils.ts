export const getDatePresets = () => {
  return [
    {
      label: 'Today',
      value: new Date().toISOString(),
    },
    {
      label: 'Tomorrow',
      value: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    },
    {
      label: '2 Days',
      value: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    },
    {
      label: '5 Days',
      value: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    },
    {
      label: '1 Week',
      value: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    },
  ];
};

