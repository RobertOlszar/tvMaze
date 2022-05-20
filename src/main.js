import { mapListToDOMElements, createDOMElem } from "./DOMActions.js";
import { getShowsByKey, getShowById } from "./apiService.js";

class TvMaze {
    constructor() {
        this.viewElems = {};
        this.showNameButtons = {};
        this.selectedName;
        this.favouritesList;
        this.initializeApp();
    }

    initializeApp = () => {
        this.connectDOMElements();
        this.setupListeners();
        this.getSelectedName();
        this.fetchAndDisplayShows();
        this.getFavouritesList();
    }

    getSelectedName = () => {
        if (localStorage.getItem('selectedName')) {
            this.selectedName = localStorage.getItem('selectedName');
        } else {
            this.selectedName = "harry";
        }
    }

    getFavouritesList = () => {
        if (localStorage.getItem('favouritesList')) {
            this.favouritesList = JSON.parse(localStorage.getItem('favouritesList'));
        } else {
            this.favouritesList = [];
        }
    }

    connectDOMElements = () => {
        const listOfIds = Array.from(document.querySelectorAll('[id]')).map(elem => elem.id);
        const listOfShowNames = Array.from(document.querySelectorAll('[data-show-name]')).map(elem => elem.dataset.showName);

        this.viewElems = mapListToDOMElements(listOfIds, 'id');
        this.showNameButtons = mapListToDOMElements(listOfShowNames, 'data-show-name');
    }

    setupListeners = () => {
        this.viewElems.searchInput.addEventListener('keydown', this.handleSubmit);
        this.viewElems.searchButton.addEventListener('click', this.handleSubmit);
        Object.keys(this.showNameButtons).forEach(showName => {
            this.showNameButtons[showName].addEventListener('click', this.setCurrentNameFilter);
        })
    }

    handleSubmit = () => {
        if (event.type === 'click' || event.key === 'Enter') {
            this.selectedName = this.viewElems.searchInput.value;
            localStorage.setItem('selectedName', this.selectedName);
            if (this.selectedName !== "") {
                searchInput.value = "";
                this.fetchAndDisplayShows();
            } else {
                this.viewElems.errorAlert.innerText = "Enter title first.";
            }
        }
    }

    setCurrentNameFilter = () => {
        this.selectedName = event.target.dataset.showName;
        this.fetchAndDisplayShows();
    }

    fetchAndDisplayShows = () => {
        getShowsByKey(this.selectedName).then(shows => this.renderCardsOnList(shows));
    }

    renderCardsOnList = (shows, favouritesList) => {
        let i = 0;
        Array.from(
            document.querySelectorAll('[data-show-id]')
        ).forEach(btn => btn.removeEventListener('click', this.openDetailsView));

        this.viewElems.showsWrapper.innerHTML = "";
        for (const favouritesItem of this.favouritesList) {
            const card = this.createShowCard(favouritesItem, null, true);
            this.viewElems.showsWrapper.appendChild(card);
        }

        for (const { show } of shows) {
            const card = this.createShowCard(show);
            this.viewElems.showsWrapper.appendChild(card);
            i++;
        }

        this.viewElems.numOfResults.innerText = `Number of results: ${i}`;

        if (i === 0) {
            this.viewElems.errorAlert.innerText = "No results.";
        } else {
            this.viewElems.errorAlert.innerText = "";
        }
    }

    openDetailsView = (event) => {
        const { showId } = event.target.dataset;
        body.style.overflow = "hidden";
        getShowById(showId).then(show => {
            const card = this.createShowCard(show, true);
            this.viewElems.showPreview.appendChild(card);
            const closeBtn = document.querySelector(`[id='showPreview'] [data-show-id="${showId}"]`);
            closeBtn.innerText = "Hide details";
            closeBtn.style.backgroundColor = "red";
            this.viewElems.showPreview.style.display = "block";
        });
    }

    closeDetailsView = (event) => {
        body.style.overflow = "initial";
        const { showId } = event.target.dataset;
        const closeBtn = document.querySelector(`[id='showPreview'] [data-show-id="${showId}"]`);
        closeBtn.removeEventListener('click', this.closeDetailsView);
        this.viewElems.showPreview.style.display = "none";
        this.viewElems.showPreview.innerHTML = '';
    }

    addToFavouritesList = (event) => {
        const { showId } = event.target.dataset;
        getShowById(showId).then(show => {
            let duplication;
            for (const favouritesItem of this.favouritesList) {
                if (favouritesItem.id === show.id) {
                    duplication = true;
                    break;
                }
            }
            if (!duplication) {
                this.favouritesList.push(show);
                localStorage.setItem('favouritesList', JSON.stringify(this.favouritesList));
                window.location.reload(true);
            }
        });
    }

    removeFromFavouritesList = (event) => {
        const { showId } = event.target.dataset;
        getShowById(showId).then(show => {
            for (const favouritesItem of this.favouritesList) {
                if (favouritesItem.id === show.id) {
                    this.favouritesList.splice(this.favouritesList.indexOf(favouritesItem), 1);
                    window.location.reload(true);
                    break;
                }
            }
            localStorage.setItem('favouritesList', JSON.stringify(this.favouritesList));
        });
    }

    createShowCard = (show, isDetailed, isFavourite) => {
        const divCard = createDOMElem('div', 'card');
        const divCardBody = createDOMElem('div', 'card-body');
        const divCardBodyText = createDOMElem('div', 'card-body-text');
        const h5 = createDOMElem('h5', 'card-title', show.name);
        const btn = createDOMElem('button', 'btn btn-primary', 'Show details');
        const btnFav = createDOMElem('button', 'btn btn-warning', 'Add to favourites');
        let img, p, h6;

        if (show.image) {
            if (isDetailed) {
                img = createDOMElem('div', 'card-preview-bg');
                img.style.backgroundImage = `url('${show.image.original}')`;
            } else {
                img = createDOMElem('img', 'card-img-top', null, show.image.medium);
            }
        } else {
            if (isDetailed) {
                img = createDOMElem('div', 'card-preview-bg');
                img.style.backgroundImage = `url('https://via.placeholder.com/210x295')`;
            } else {
                img = createDOMElem('img', 'card-img-top', null, "https://via.placeholder.com/210x295");
            }
        }
        
        if (isDetailed) {
            let cast = "";

            for (let i = 0; i < show._embedded.cast.length; i++) {
                if (i < show._embedded.cast.length - 1) {
                    cast += `${show._embedded.cast[i].person.name}, `;
                } else {
                    cast += `${show._embedded.cast[i].person.name}`;
                }
            }

            if (cast) {
                h6 = createDOMElem('h6', 'card-title');
                h6.innerText = `Cast: ${cast}`;
            }else {
                h6 = createDOMElem('h6', 'card-title', "No cast specified");
            }

        } else {
            h6 = createDOMElem('h6', 'card-title', "");
        }

        if (show.summary) {
            if (isDetailed) {
                p = createDOMElem('p', 'card-text', DOMPurify.sanitize(show.summary));
            } else {
                p = createDOMElem('p', 'card-text', `${DOMPurify.sanitize(show.summary).slice(0, 40)}...`);
            }
        } else {
            p = createDOMElem('p', 'card-text', "There is no summary.");
        }

        btn.dataset.showId = show.id;
        btnFav.dataset.showId = show.id;

        if (isDetailed) {
            btn.addEventListener('click', this.closeDetailsView);
        } else {
            btn.addEventListener('click', this.openDetailsView);
        }

        if (isDetailed) {
            btnFav.style.display = "none";
        } else {
            if (isFavourite) {
                btnFav.style.backgroundColor = 'red';
                btnFav.innerText = "Delete favorite";
                btnFav.addEventListener('click', this.removeFromFavouritesList);
            } else {
                btnFav.addEventListener('click', this.addToFavouritesList);
            }
        }

        divCard.appendChild(divCardBody);
        divCardBody.appendChild(img);
        divCardBody.appendChild(divCardBodyText);
        divCardBodyText.appendChild(h5);
        divCardBodyText.appendChild(h6);
        divCardBodyText.appendChild(p);
        divCardBodyText.appendChild(btn);
        divCardBodyText.appendChild(btnFav);

        return divCard;
    }
}

document.addEventListener("DOMContentLoaded", new TvMaze());