'use client';
import React, { useState } from 'react';
import './statusButton.css';
import { useSearchParams, usePathname, useRouter } from '@/old/navigation';

import 'material-symbols';
import { Button } from '@/old/ui/button';


export default function StatusButtons() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const [selectedStatus, setSelectedStatus] = useState<string>(
        searchParams.get("status") ?? ""
    );

    const isSelected = (statusId: string) => selectedStatus === statusId;

    const filterStatus = (e: React.MouseEvent<HTMLButtonElement>, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedStatus === value && value !== "0") {
          setSelectedStatus("0");

          params.delete("status");
          params.set("status", "0");
          
        } else {
          setSelectedStatus(value);
          params.set("status", value);
          e.currentTarget.focus();
        }
      
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };
    return (
        <div className="statusButton" role="group" aria-labelledby="petition-status-label">
            <h2 id="petition-status-label">Filter by:</h2>
            <div className="statusButton-options">
                <Button onClick={(e) => filterStatus(e, "0")} aria-pressed={isSelected("0")} variant="outline">
                    Active
                </Button>
                <Button onClick={(e) => filterStatus(e, "1")} aria-pressed={isSelected("1")} variant="outline">
                    Charged
                </Button>
                <Button onClick={(e) => filterStatus(e, "2")} aria-pressed={isSelected("2")} variant="outline">
                    Responded
                </Button>
                <Button onClick={(e) => filterStatus(e, "3")} aria-pressed={isSelected("3")} variant="outline">
                    Expired
                </Button>
            </div>
        </div>
    );
}
