let appStatuses = {
	startup: "Setting up...",
	filtering: "Filtering tsums...",
	noTsums: "No Tsums!",
	waiting: "Select a Tag"
}


let attributeSections = [
	"Gender",
	"Initials",
	"Skills",
	"Series",
	"Grouping Colors",
	"Mission Colors",
	
]

let app = new Vue({
	el:"main",
	data: {
		tsums: [],
		attributes: [],
		//selectedTsums: [],
		selectedAttributes: [],
		tsumsOfCategories: [],
		status: appStatuses.startup,
        searchTerm: '',
        tsumAttributeDictionary: {},
	},
	methods: {
		selectTag(e) {
			this.tsumsOfCategories = [];
			if(e.target.checked) {
				this.selectedAttributes.push(e.target.id);
			}
			else {
				this.selectedAttributes.splice(this.selectedAttributes.indexOf(e.target.id), 1);
			}
			this.status = appStatuses.filtering;
			getTsumsWithTags(this.selectedAttributes);
		},
        selectTsum(e) {
            let tsumID = e.target.parentElement.getAttribute('id') || e.target.parentElement.parentElement.getAttribute('id');
            console.log(tsumID);
            tsumInfo.id = tsumID;

            getTsumCategories(tsumID);
        }
	},
	computed: {
		sortedAttributes() {
			return this.attributes.sort((a, b) => a[0].localeCompare(b[0]))
		},
		selectedTsums() {
			let selTsums = this.tsums;
            selTsums = selTsums.filter(t => t.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

			if(this.tsumsOfCategories.length < 1) return selTsums;
			
			for(let a of this.tsumsOfCategories) {
				selTsums = selTsums.filter(t => {return a[1].includes(t.id);});
			}
			return selTsums;
		},
		getAppStatus() {
			if(this.status == appStatuses.startup) {
				if(this.tsums.length > 400 && this.attributes.length >= 7) {
					this.status = appStatuses.waiting;
				}
			}
			else if(this.status == appStatuses.filtering && this.tsumsOfCategories.length == this.selectedAttributes.length) {
				if(this.tsums.length < 1)
					this.status = appStatuses.noTsums;
				else
					this.status = appStatuses.waiting;
			}
			return this.status;
		}
	}
	
});


let tsumInfo = new Vue({
    el:'#tsumInfo',
    data: {
        id: 0,
        name: '',
        attributes:[],
        url:'',
        showInfo: false
    },
    methods: {
        getImage(id) {
            console.log(app.tsums);
            let tsum = app.tsums.filter(t => {return t.id == id;});
            return tsum[0] ? tsum[0].pic : '';
        },
        hideTsumInfo() {
            this.showInfo =false;
        }
    }
})


function getTsumsWithTags(attributes){//, nextTsums) {
	let tsums = app.tsums;

	for(let attr of attributes) {
		console.log(encodeURIComponent(attr.replaceAll("|", "_")));
		fetch("https://people.rit.edu/lep2738/tsum-searcher/proxy/proxy.php?action=getbycategory&category="
			  + encodeURIComponent(attr.replaceAll("|", "_")))//remove encodeuricomp if it doesnt work
		.then(response => {return response.json();})
		.then(json=>{
			let tsumsInCategory = json.query.categorymembers.map(t=>t.pageid);
			app.tsumsOfCategories.push([attr, tsumsInCategory]);
			console.log("added '" + attr + "' to attributes");
			console.log(app.tsumsOfCategories);
		});
	}

}

function getTsumCategories(tsumID) {
    
    let results = app.tsumAttributeDictionary[""+tsumID];
    
    if(results) {
        let rawCategories = results.categories;
        
        let rawTitle = results.title;
        tsumInfo.name = rawTitle;
        let categories = rawCategories.map(c => {return c.title.split(':')[1];});
        tsumInfo.attributes = categories;
        tsumInfo.url = "https://disneytsumtsum.fandom.com/" + results.title.replace(' ', '_');
        tsumInfo.showInfo = true;
        return;
    }
    
    fetch("https://people.rit.edu/lep2738/tsum-searcher/proxy/proxy.php?action=gettsumcategories&ids=" + tsumID)
    .then(response=>{ return response.json();})
    .then(json=> {
        let results = json.query.pages["" + tsumID];
        //adds to dictionary so we don't have to repeatedly call this.
        app.tsumAttributeDictionary[""+tsumID] = results;
        
        let rawCategories = results.categories;
        
        let rawTitle = results.title;
        tsumInfo.name = rawTitle;
        let categories = rawCategories.map(c => {return c.title.split(':')[1];});
        tsumInfo.attributes = categories;
        tsumInfo.url = "https://disneytsumtsum.fandom.com/" + results.title.replace(' ', '_');
    })
    .then(()=>{
        tsumInfo.showInfo = true;
    });
}

function init() {
	//get all tsums
	fetch("https://people.rit.edu/lep2738/tsum-searcher/proxy/proxy.php")
	.then(response=>{ return response.json();})
	.then(json=>{
		let results = json.query.categorymembers;
		
		let idstring = results.map(t=>t.pageid).join(",");
		
		//gets the details of each tsum
		fetch("https://people.rit.edu/lep2738/tsum-searcher/proxy/proxy.php?action=gettsumdetails&ids=" + idstring)
		.then(response=>{return response.json();})
		.then(json=>{

			let tsumDetails = Object.values(json.items);
			tsumDetails = tsumDetails.filter(t => 
							   t.title.indexOf("Category:") == -1 
							   && t.title.indexOf(".png") == -1 
							   && t.title.indexOf(".jpg") == -1
							   && t.title.indexOf("Event") == -1
							   && t.url.indexOf("Category:") == -1);
			//app.selectedTsums = tsumDetails.map(t => t.id);
			app.tsums = tsumDetails.map(t=>{
					return {
						name: t.title,
						id: t.id,
						url: "https://disneytsumtsum.fandom.com" + t.url,
						pic: t.thumbnail ? t.thumbnail.split(".png")[0] + ".png" : ""
					};
			});
		});
	});
	//gets miscelaneous attributes of tsums
	fetch("https://people.rit.edu/lep2738/tsum-searcher/proxy/proxy.php?action=getbycategory&category=Attributes")
	.then(response=>{return response.json();})
	.then(json=>{
		let results = json.query.categorymembers;
		let attr = results.map(c => c.title.split("Category:")[1]);
		app.attributes.push(["Misc", attr.filter(c => !attributeSections.includes[c])]);
	});
	
	//gets other categorized attributes of tsums
	for(let a of attributeSections) {
        //if(!a) continue;
		fetch("https://people.rit.edu/lep2738/tsum-searcher/proxy/proxy.php?action=getbycategory&category=" + a.replace(" ", "_"))
		.then(response=>{return response.json();})
		.then(json=> {
			let results = json.query.categorymembers;
			let attr = results.map(c => c.title.split("Category:")[1] || '').filter(a=>a.length >0);
            if(attr && attr.length > 0)
              app.attributes.push([a, attr]);
		});
	}
	
	
}
export {init};