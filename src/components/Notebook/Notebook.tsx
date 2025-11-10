import React, { useState, useEffect } from 'react';
import './Notebook.css';
import { useHistory } from 'react-router-dom';
import pencil from '/public/assets/pencil.svg';
/**
 * My Notebook widget
 * 
 * 
 * shows difference links to notebooks
 */

const Notebook: React.FC = () => {
    const history = useHistory();

    return (
        <div className='NotebookMainDiv'>
            <div className='NotebookMainDivListOuter'>
                <p>10/20</p>
                <ul>
                    <li><u>Class Notes</u></li>
                    <li><u>Gesture help</u></li>
                </ul>
            </div>
            <div className='NotebookMainDivListOuter'>
                <p>10/19</p>
                <ul>
                    <li><u>Class Notes</u></li>
                </ul>
            </div>
            <div className='NotebookMainDivListOuter'>
                <p>10/17</p>
                <ul>
                    <li><u>Class Notes</u></li>
                    <li><u>ASL History</u></li>
                </ul>
            </div>
            <div className='DividerLine'>notext</div>
            <button onClick={() => history.push('/notes')}>
                <div className='NewEntry'>
                    <p><u>New Entry</u></p>
                    <img src={pencil}/>
                </div>
            </button>
        </div>
    );
};

export default Notebook;




