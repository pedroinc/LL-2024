import dayjs from "dayjs";

export const getStartOfDay = (strDate: String): Date | null => {
    // yyyy-mm-dd
    if (!strDate) return null;
  
    return dayjs(strDate as string)
      .startOf("day")
      .toDate();
  };
  
  export const getEndOfDay = (strDate: String): Date | null => {
    // yyyy-mm-dd
    if (!strDate) return null;
  
    return dayjs(strDate as string)
      .endOf("day")
      .toDate();
  };