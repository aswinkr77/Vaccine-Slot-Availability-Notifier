const stateUrl = "https://cdn-api.co-vin.in/api/v2/admin/location/states";
const selectDistricts = document.getElementById("districts");
const selectStates = document.getElementById("states");
const selectAge = document.querySelectorAll("input[name='age']");
const selectDate = document.getElementById("date");
const search = document.getElementById("search");
const stopSearch = document.getElementById("stop");
const selectUser = document.getElementById("username");
const arrayValue = [selectStates, selectDistricts, selectDate, search, selectUser];

const today = new Date().toISOString().split("T")[0];
selectDate.setAttribute("value", today);
selectDate.setAttribute("min", today);

const maxDay = new Date();
maxDay.setDate(maxDay.getDate() + 83);
selectDate.setAttribute("max", maxDay.toISOString().split("T")[0]);

let disData = (url) => {
    fetch(url)
    .then(res => res.json())
        .then(data => {
            if(data["districts"].length)
                selectDistricts.options.length = 0;

            for(let i = 0; i < data["districts"].length; ++i)
            {
                let optionDistricts = document.createElement("option");
                optionDistricts.value = data["districts"][i]["district_id"];
                optionDistricts.innerHTML = data["districts"][i]["district_name"];
                selectDistricts.appendChild(optionDistricts);
            }
        })
    .catch(err => console.log(err));
};

let stop = () => {
    arrayValue.forEach(item => {
        item.removeAttribute("disabled");
    });
    selectAge.forEach(item => {
        item.removeAttribute("disabled");
    });
    stopSearch.setAttribute("disabled", "true");
}


let stateData = (url) => {
    fetch(url)
    .then(res => res.json())
        .then(data => {
            for(let i = 0; i < data["states"].length; ++i)
            {
                let optionStates = document.createElement("option");
                optionStates.value = data["states"][i]["state_id"];
                optionStates.innerHTML = data["states"][i]["state_name"];
                selectStates.appendChild(optionStates);
            }

            let stateValue = selectStates.value;
            let districtURL = `https://cdn-api.co-vin.in/api/v2/admin/location/districts/${stateValue}`;
            disData(districtURL);
        })
    .catch(err => console.log(err));
};

let fetchDistrict, date_today, selectedDate, dateArray, reverseDate, districtValue;
let vaccineAvail = (url, age, user) => {
    date_today = new Date().toISOString().split("T")[0];
    if(date_today > selectDate.value)
    {
        districtValue = selectDistricts.value;
        dateArray = date_today.split("-");
        reverseDate = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;
        fetchDistrict = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${districtValue}&date=${reverseDate}`;
        url = fetchDistrict;
    }

    fetch(url)
    .then(res => res.json())
        .then(data => {
            if(data["sessions"].length > 0)
            {
                let tgURL = "1";
                if(age == 0)
                    tgURL = `https://api.callmebot.com/text.php?user=@${user}&text=Vaccine+Available+at+${data["sessions"].length}+Locations+in+${data["sessions"][0]["district_name"]}+District+of+${data["sessions"][0]["state_name"]}`;
                else
                {
                    let age_18 = 0, age_45 = 0; 
                    for(let i = 0; i < data["sessions"].length; ++i)
                    {
                        if(data["sessions"]["min_age_limit"] == 18)
                            ++age_18;
                        else
                            ++age_45;
                    }

                    if(age_18 >= 1 && age == 18)
                        tgURL = `https://api.callmebot.com/text.php?user=@${user}&text=Vaccine+Available+for+Age+Category+18+and+Above+at+${age_18}+Locations+in+${data["sessions"][0]["district_name"]}+District+of+${data["sessions"][0]["state_name"]}`;
                    else if(age == 45 && age_45 >= 1)
                        tgURL = `https://api.callmebot.com/text.php?user=@${user}&text=Vaccine+Available+for+Age+Category+45+and+Above+at+${age_45}+Locations+in+${data["sessions"][0]["district_name"]}+District+of+${data["sessions"][0]["state_name"]}`;
                }

                if(tgURL != "1")
                {
                    fetch(tgURL, {mode: "no-cors"})
                        .then((res) => {
                            /*console.log(res);*/
                        })
                        .catch((err) => {
                            /*API not returning Error when TG username is not registered with callmebot*/
                            /*console.log(err);*/
                        });

                    stop();
                }
                else
                    setTimeout(vaccineAvail, 30*1000, url);
            }
            else
                setTimeout(vaccineAvail, 30*1000, url);
    })
    .catch(err => alert(err));
}


selectStates.addEventListener("change", () => {
    let stateValue = selectStates.value; 
    let districtURL = `https://cdn-api.co-vin.in/api/v2/admin/location/districts/${stateValue}`;
    disData(districtURL); 
});

search.addEventListener("click", () => {
    const user = selectUser.value;
    selectedDate = selectDate.value;

    if((user == "") || (selectedDate < today) || (selectedDate > maxDay.toISOString().split("T")[0]))
    {
        if(user == "")
            alert("Username Required");
        else
            alert(`Select Date in the range from ${today} to ${maxDay.toISOString().split("T")[0]}`)
    }
    else
    {
        arrayValue.forEach(item => {
            item.setAttribute("disabled", "true");
        });
        selectAge.forEach(item => {
            item.setAttribute("disabled", "true");
        });
    
        stopSearch.removeAttribute("disabled");
    
        districtValue = selectDistricts.value;
        dateArray = selectedDate.split("-");
        reverseDate = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;
        fetchDistrict = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${districtValue}&date=${reverseDate}`;
        const age = document.querySelector("input[name='age']:checked").value;
        
        vaccineAvail(fetchDistrict, age, user);
    }
});

document.getElementById("info").addEventListener("click", () => {
    document.getElementById("modal").style.display = "flex";
});

document.getElementById("close").addEventListener("click", () => {
    document.getElementById("modal").style.display = "none";
})

stopSearch.addEventListener("click", stop);
stateData(stateUrl);