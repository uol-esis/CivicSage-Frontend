import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import * as CivicSage from 'civic_sage';

export default function Feedback(){

    const [category, setCategory] = useState("search");
    const navigate = useNavigate();
    const [isFeedbackSend, setFeedbackSend] = useState(false);
    const [comment, setComment] = useState('');

    function handleSubmit(e) {
        // Prevent the browser from reloading the page
        e.preventDefault();

        // Read the form data
        const form = e.target;
        const formData = new FormData(form);

        // Or you can work with it as a plain object:
        const formJson = Object.fromEntries(formData.entries());
        formJson.category = category;
        const jsonString = JSON.stringify(formJson);
        console.log("Feedback JSON:", jsonString);
        sendToServer(jsonString);
    }

    function sendToServer(feedbackString){
        const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
        let apiInstance = new CivicSage.DefaultApi(client);
        let feedback = new CivicSage.Feedback(feedbackString);
        apiInstance.submitFeedback(feedback, (error, data, response) => {
            if (error) {
                setFeedbackSend(false);
                console.error(error);
            } else {
                setFeedbackSend(true);
                setComment('');
                console.log('API called successfully. Returned data: ' + data);
            }
        });
    }

    return(
        <div className='flex items-center justify-center mt-4'>
            <div className='w-1/2 flex flex-col items-center gap-4'>
                <p className='text-lg font-semibold'>Feedback</p>
                <p>
                    Bitte fassen Sie hier zusammen, welche Funktionen Sie benutzt haben und wie Ihre Erfahrung damit war. <br/> 
                </p>
                {/* Feedback successful sent */}
                {isFeedbackSend &&
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Feedback wurde gesendet!</h3>
                            </div>
                        </div>
                    </div>
                }
                
            {/* Choose category */}
                <div className='p-4 self-start'>
                    <label htmlFor="location" className="text-left block text-sm/6 font-medium text-gray-900">
                        Kategorie
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                        <select
                            id="location"
                            name="location"
                            onChange={(choice) => {setCategory(choice.target.value)}}
                            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        >
                            <option value={"seach"}>Suche</option>
                            <option value={"upload"}>Upload</option>
                            <option value={"bugs"}>Fehler</option>
                            <option value={"other"}>Sonstiges</option>
                        </select>
                        <ChevronDownIcon
                            aria-hidden="true"
                            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                        />
                    </div>
                </div>

                {/* Text input */}
                <form className="w-full p-4" method="post" onSubmit={handleSubmit}>
                <label htmlFor="comment" className="text-left block text-sm/6 font-medium text-gray-900">
                    Feedback
                </label>
                <div className="mt-2">
                    <textarea
                        id="comment"
                        name="comment"
                        rows={4}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
                
                {/* Buttons */}
                <div className='flex justify-between'>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="p-4 m-4 rounded-md bg-gray-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Zurück
                    </button>
                     <button
                        type="submit"
                        className="p-4 m-4 rounded-md bg-gray-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Senden
                    </button>
                </div>
                </form>

            </div>
        </div>
    );
}