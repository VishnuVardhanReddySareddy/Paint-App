const userProfile = {
    username: "artbuddy_123",
    email: "user@example.com",
    preferences: {
        theme: "dark",
        notifications: {
            email: true,
            push: false,
        },
        shortcuts: ["Ctrl+Z", "Ctrl+S", "Ctrl+Shift+E"]
    },
    stats: {
        drawings: [
            { title: "Sunset", date: "2025-04-01", likes: 24 },
            { title: "Mountain", date: "2025-04-10", likes: 30 }
        ],
        followers: 105,
        following: 56
    },
    isActive: true
};


function flatObject(userProfile,pk = "",result = {}){

	for(let ele in userProfile){

		let key = pk?`${pk}.${ele}`:ele;

        if(typeof userProfile[ele] === "object"){

		
			flatObject(userProfile[ele],key,result);
			}
		else {
			result[key] = userProfile[ele];
		}
    }

    return result;

}


console.log(flatObject(userProfile,"",{}));