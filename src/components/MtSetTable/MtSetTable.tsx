import React, { useState, useEffect } from 'react';
import folder from '/public/assets/folder.svg';
import dropDown from '/public/assets/dropDownClosed.svg';
import appIcon from '/public/assets/square-plus.svg';
import './MtSetTable.css';

/**
 * My Set Table
 * 
 * 
 * Shows the different sets and an add set button.
 */

const MtSetTable: React.FC = () => {
    const [mtSets, setMtSets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // fetch or initialize data here later
      // setMtSets(data);
      // setLoading(false);
    }, []);

    const handleAdd = () => {
      // logic to add new set
    };


    return (
        <div className='SetContentLeftSideMySets'>
            <div className='SetContentLeftSideMySetsHeader'>
                <p><u>My Sets</u></p>
            </div>
            <div className='SetContentLeftSideMySetsUserSets'>
                {/* Filler Sets for the DEMO, TODO need to add func */}
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>101</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer' style={{backgroundColor: '#F05248'}}>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>102</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>Nums</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer' style={{backgroundColor: '#F05248'}}>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>Unit 1</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>Unit 2</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>103</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>104</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>Animals</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>105</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>106</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
                <div className='SetContentLeftSideMySetsUserSetsContainer'>
                    <img src={ folder } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                    <p>107</p>
                    <img src={ dropDown } className='SetContentLeftSideMySetsUserSetsContainerImg'/>
                </div>
            </div>
            <div className='SetContentLeftSideMySetsAddNew'>
                <p><u>My Sets</u></p>
                <img src={appIcon} className='SetContentLeftSideMySetsAddNewImg'/>
            </div>
            
        </div>
    );
};

export default MtSetTable;




