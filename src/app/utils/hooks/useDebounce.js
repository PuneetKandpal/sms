const { useState, useEffect } = require("react");

function useDebounce(query, delayinMillis) {
  const [debouncedvalue, setDebouncedValue] = useState(query);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebouncedValue(query);
    }, delayinMillis);

    return () => {
      clearTimeout(timeOut);
    };
  }, [query, delayinMillis]);

  return debouncedvalue;
}

export default useDebounce;
