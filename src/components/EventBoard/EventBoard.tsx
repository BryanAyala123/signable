import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSpinner } from '@ionic/react';
import { getDatabase, ref, onValue } from 'firebase/database';

// Define the Event type
type Event = {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
};

const EventBoard: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getDatabase();
        const eventsRef = ref(db, 'events');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            const data = snapshot.val();
            const loadedEvents: Event[] = [];
            if (data) {
                Object.entries(data).forEach(([id, event]: [string, any]) => {
                    loadedEvents.push({
                        id,
                        title: event.title,
                        description: event.description,
                        date: event.date,
                        location: event.location,
                    });
                });
            }
            setEvents(loadedEvents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Event Board</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {loading ? (
                    <IonSpinner name="crescent" />
                ) : (
                    <IonList>
                        {events.map(event => (
                            <IonItem key={event.id}>
                                <IonLabel>
                                    <h2>{event.title}</h2>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {event.date}</p>
                                    <p><strong>Location:</strong> {event.location}</p>
                                </IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                )}
            </IonContent>
        </IonPage>
    );
};

export default EventBoard;