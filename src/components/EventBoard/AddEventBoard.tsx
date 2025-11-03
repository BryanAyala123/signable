import React, { useState } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonAlert,
    IonList,
} from '@ionic/react';
// Import Admin SDK
import { getDatabase, ref, set } from "firebase/database";


interface EventFormData {
    title: string;
    date: string;
    location: string;
    description: string;
}

const initialFormState: EventFormData = {
    title: '',
    date: '',
    location: '',
    description: '',
};

const AddEventBoard: React.FC = () => {
    const [form, setForm] = useState<EventFormData>(initialFormState);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: CustomEvent) => {
        const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setForm(initialFormState);
        console.log('Event Data:', form);
        const db = getDatabase();
        set(ref(db, 'events/' + 1), {
            title: form.title,
            date: form.date,
            location: form.location,
            description: form.description
        });
        console.log('Event saved to database');

    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Add ASL Event</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={handleSubmit}>
                    <IonList>
                        <IonItem>
                            <IonLabel position="stacked">Title</IonLabel>
                            <IonInput
                                name="title"
                                value={form.title}
                                onIonChange={handleChange}
                                required
                                type="text"
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Date</IonLabel>
                            <IonInput
                                name="date"
                                value={form.date}
                                onIonChange={handleChange}
                                required
                                type="date"
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Location</IonLabel>
                            <IonInput
                                name="location"
                                value={form.location}
                                onIonChange={handleChange}
                                required
                                type="text"
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Description</IonLabel>
                            <IonTextarea
                                name="description"
                                value={form.description}
                                onIonChange={handleChange}
                                required
                                rows={4}
                            />
                        </IonItem>
                    </IonList>
                    <IonButton expand="block" type="submit" style={{ marginTop: 16 }}>
                        Add Event
                    </IonButton>
                </form>
                <IonAlert
                    isOpen={submitted}
                    onDidDismiss={() => setSubmitted(false)}
                    message="Event added successfully!"
                    buttons={['OK']}
                />
            </IonContent>
        </IonPage>
    );
};

export default AddEventBoard;