import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, remove, update } from 'firebase/database';
import {
IonPage,
IonHeader,
IonToolbar,
IonTitle,
IonContent,
IonList,
IonItem,
IonLabel,
IonButton,
IonInput,
IonTextarea,
IonDatetime,
IonModal,
IonFooter,
} from '@ionic/react';

interface Event {
id: string;
title: string;
description: string;
date: string;
location: string;
}

const EditEventBoard: React.FC = () => {
const [events, setEvents] = useState<Event[]>([]);
const [editingEvent, setEditingEvent] = useState<Event | null>(null);
const [showModal, setShowModal] = useState(false);

useEffect(() => {
    const db = getDatabase();
    const eventsRef = ref(db, 'events');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedEvents: Event[] = [];
        for (const id in data) {
            loadedEvents.push({ id, ...data[id] });
        }
        setEvents(loadedEvents);
    });
    return () => unsubscribe();
}, []);

const handleDelete = async (id: string) => {
    const db = getDatabase();
    await remove(ref(db, `events/${id}`));
};

const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowModal(true);
};

const handleUpdate = async () => {
    if (!editingEvent) return;
    const db = getDatabase();
    const { id, title, description, date, location } = editingEvent;
    await update(ref(db, `events/${id}`), { title, description, date, location });
    setShowModal(false);
    setEditingEvent(null);
};

return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonTitle>Edit Event Board</IonTitle>
            </IonToolbar>
        </IonHeader>
        <IonContent>
            <IonList>
                {events.map((event) => (
                    <IonItem key={event.id}>
                        <IonLabel>
                            <h2>{event.title}</h2>
                            <p>{event.description}</p>
                            <p>Date: {event.date}</p>
                            <p>Location: {event.location}</p>
                        </IonLabel>
                        <IonButton color="primary" onClick={() => handleEdit(event)}>
                            Edit
                        </IonButton>
                        <IonButton color="danger" onClick={() => handleDelete(event.id)}>
                            Delete
                        </IonButton>
                    </IonItem>
                ))}
            </IonList>
            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Edit Event</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    {editingEvent && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdate();
                            }}
                        >
                            <IonItem>
                                <IonLabel position="stacked">Title</IonLabel>
                                <IonInput
                                    value={editingEvent.title}
                                    onIonChange={(e) =>
                                        setEditingEvent({ ...editingEvent, title: e.detail.value! })
                                    }
                                    required
                                />
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Description</IonLabel>
                                <IonTextarea
                                    value={editingEvent.description}
                                    onIonChange={(e) =>
                                        setEditingEvent({ ...editingEvent, description: e.detail.value! })
                                    }
                                    required
                                />
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Date</IonLabel>
                                <IonDatetime
                                    value={editingEvent.date}
                                    onIonChange={(e) => {
                                        const value = e.detail.value;
                                        setEditingEvent({
                                            ...editingEvent,
                                            date: Array.isArray(value) ? value.join(',') : value ?? ''
                                        });
                                    }}
                                    presentation="date"
                                />
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Location</IonLabel>
                                <IonInput
                                    value={editingEvent.location}
                                    onIonChange={(e) =>
                                        setEditingEvent({ ...editingEvent, location: e.detail.value! })
                                    }
                                    required
                                />
                            </IonItem>
                            <IonFooter>
                                <IonButton expand="block" type="submit">
                                    Update
                                </IonButton>
                                <IonButton expand="block" color="medium" onClick={() => setShowModal(false)}>
                                    Cancel
                                </IonButton>
                            </IonFooter>
                        </form>
                    )}
                </IonContent>
            </IonModal>
        </IonContent>
    </IonPage>
);
};

export default EditEventBoard;