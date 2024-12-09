import { useEffect } from 'react';

export function useGridResize(gridRef: React.RefObject<any>, gridReady: boolean) {
  useEffect(() => {
    if (gridReady && gridRef.current) {
      const gridApi = gridRef.current.api;
      
      const handleResize = () => {
        setTimeout(() => {
          gridApi.sizeColumnsToFit();
        }, 0);
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Initial size fit

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [gridReady, gridRef]);
}

