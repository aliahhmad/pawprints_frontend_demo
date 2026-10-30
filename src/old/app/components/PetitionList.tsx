'use client'
import { localFetch as fetch } from "@/old/local-fetch";

import { useState, useEffect, useCallback, useRef } from 'react';
import Petition, { PetitionType } from './Petition';
import './petitioncontainer.css';
import PetitionEmpty from './PetitionEmpty';
import PetitionDetail from './PetitionDetail';
import { API_URL, GET } from '../api/specialRoute';
import Loading from './loading';
import { useSearchParams, useRouter } from '@/old/navigation';
import type { PetitionSort } from '@/old/lib/petitionSort';

const ITEMS_PER_PAGE = 40;

export default function PetitionList({
    initialData,
    query,
    tag,
    status,
    sort = ''
}: {
    initialData: PetitionType[];
    query?: string;
    tag?: string;
    status ?: string;
    sort?: PetitionSort;
}) {
    const [petitions, setPetitions] = useState(initialData);
    const [page, setPage] = useState(2);
    const [hasMore, setHasMore] = useState(initialData.length === ITEMS_PER_PAGE);
    const [isLoading, setIsLoading] = useState(false);
    const [openPetition, setOpenPetition] = useState<PetitionType | null>(null);
    const fetchInProgress = useRef(false);
    const requestController = useRef<AbortController | null>(null);
    const initialDataRef = useRef(initialData);
    const searchParams = useSearchParams();
    const router = useRouter();
    const openPetitionId = searchParams.get('petition');


    useEffect(() => {
        if (petitions != undefined && petitions.length > 0) {
            // Save petitions and page state to sessionStorage when they change
            sessionStorage.setItem("petitions", JSON.stringify(petitions));
            sessionStorage.setItem("page", page.toString());
        }
    }, [petitions, page]);

    // PetitionContainer remounts this list for each filter/sort combination.
    // Cancel old requests so they cannot append results after a navigation.
    useEffect(() => {
        const controller = new AbortController();
        requestController.current = controller;

        const fetchFallback = async () => {

            fetchInProgress.current = true;
            setIsLoading(true);
            try {
                const result = await GET(query, status, tag, 1, ITEMS_PER_PAGE, sort, controller.signal);
                if (controller.signal.aborted) return;
                const data = result.petitions || [];
                setPetitions(data);
                setHasMore(data.length === ITEMS_PER_PAGE);
            } catch (error) {
                if (!controller.signal.aborted) console.error('Error fetching petitions:', error);
            } finally {
                if (!controller.signal.aborted) {
                    fetchInProgress.current = false;
                    setIsLoading(false);
                }
            }
        };
        fetchFallback();
        return () => controller.abort();
    }, [query, status, tag, sort]);


    const fetchMorePetitions = useCallback(async () => {
        if (fetchInProgress.current || !hasMore) return;
        const controller = requestController.current;
        if (!controller || controller.signal.aborted) return;

        try {
            fetchInProgress.current = true;
            setIsLoading(true);
            const result = await GET(query, status, tag, page, ITEMS_PER_PAGE, sort, controller.signal);
            if (controller.signal.aborted) return;
            const data = result.petitions || [];
            setHasMore(data.length === ITEMS_PER_PAGE);
            if (data.length > 0) {
                setPetitions(prev => [...prev, ...data]);
                setPage(prev => prev + 1);
            }
        } catch (error) {
            if (!controller.signal.aborted) console.error('Error fetching more petitions:', error);
        } finally {
            if (!controller.signal.aborted) {
                fetchInProgress.current = false;
                setIsLoading(false);
            }
        }
    }, [tag, query, status, sort, page, hasMore]);

    useEffect(() => {
        async function loadPetition() {
            if (!openPetitionId) {
            setOpenPetition(null);
            return;
            }

            const id = Number(openPetitionId);

            // check if already in list
            const existing = petitions.find(p => p.id === id);
            if (existing) {
            setOpenPetition(existing);
            return;
            }

            // otherwise fetch directly
            const res = await fetch(`${API_URL}/api/v1/petitions/${id}`, {
            credentials: 'include'
            });
            const data = await res.json();
            setOpenPetition(data);
        }

        loadPetition();
    }, [openPetitionId, petitions]);


    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop >=
            document.documentElement.offsetHeight - 5
        ) {
            fetchMorePetitions();
        }
    }, [fetchMorePetitions]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleSignatureUpdate = useCallback((id: number, newCount: number) => {
        setPetitions(prevPetitions => 
            prevPetitions.map(p => 
                p.id === id ? { ...p, total_signatures: newCount } : p
            )
        );

        setOpenPetition(prev => 
            (prev && prev.id === id) 
                ? { ...prev, total_signatures: newCount } 
                : prev
        );
    }, []);

    try {
        
        return (
            <>
            <div className="petitions-container">
                {petitions.length > 0 ? (
                    petitions.map((petition: PetitionType) => (
                        <Petition key={petition.id} p={petition}/>
                    ))
                ) : (
                    !isLoading && <PetitionEmpty />
                )}
                {openPetition && (
                <PetitionDetail
                    p={openPetition}
                    petitionId={openPetition.id}
                    totalSignatures={openPetition.total_signatures}
                    onSignedChange={handleSignatureUpdate}
                    isOpen={true}
                    onClose={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.delete('petition');
                        router.push(`?${params.toString()}`, { scroll: false });
                    }}
                />
                )}
            </div>
                {isLoading && <div className="loader-container"><Loading /></div>}
            </>
        );
    } catch (e) {
        console.log(e);
        return <PetitionEmpty />;
    }
}
