import { mapListToDOMElements, createDOMElem } from "./DOMActions.js";
import { getShowsByKey, getShowById } from "./apiService.js";

class TvMaze {
    constructor() {
        this.viewElems = {};
        this.showNameButtons = {};
        this.selectedName = "harry";
        this.initializeApp();
    }

    initializeApp = () => {
        this.connectDOMElements();
        this.setupListeners();
        this.fetchAndDisplayShows();
    }

    connectDOMElements = () => {
        const listOfIds = Array.from(document.querySelectorAll('[id]')).map(elem => elem.id);
        const listOfShowNames = Array.from(document.querySelectorAll('[data-show-name]')).map(elem => elem.dataset.showName);

        this.viewElems = mapListToDOMElements(listOfIds, 'id');
        this.showNameButtons = mapListToDOMElements(listOfShowNames, 'data-show-name');
    }

    setupListeners = () => {
        Object.keys(this.showNameButtons).forEach(showName => {
            this.showNameButtons[showName].addEventListener('click', this.setCurrentNameFilter);
        })
    }

    setCurrentNameFilter = () => {
        this.selectedName = event.target.dataset.showName;
        this.fetchAndDisplayShows();
    }

    fetchAndDisplayShows = () => {
        getShowsByKey(this.selectedName).then(shows => this.renderCardsOnList(shows));
    }

    renderCardsOnList = (shows) => {
        Array.from(
            document.querySelectorAll('[data-show-id]')
        ).forEach(btn => btn.removeEventListener('click', this.openDetailsView));

        this.viewElems.showsWrapper.innerHTML = "";

        for (const { show } of shows) {
            const card = this.createShowCard(show);
            this.viewElems.showsWrapper.appendChild(card);
        }
    }

    openDetailsView = (event) => {
        const { showId } = event.target.dataset;
        console.log(showId);
        getShowById(showId).then(show => {
            const card = this.createShowCard(show, true);
            console.log(card);
            this.viewElems.showPreview.appendChild(card);
            const closeBtn = document.querySelector(`[id='showPreview'] [data-show-id="${showId}"]`);
            closeBtn.innerText = "Hide details";
            closeBtn.style.backgroundColor = "red";
            this.viewElems.showPreview.style.display = "block";
        });
    }

    closeDetailsView = (event) => {
        const { showId } = event.target.dataset;
        const closeBtn = document.querySelector(`[id='showPreview'] [data-show-id="${showId}"]`);
        closeBtn.removeEventListener('click', this.closeDetailsView);
        this.viewElems.showPreview.style.display = "none";
        this.viewElems.showPreview.innerHTML = '';
    }

    createShowCard = (show, isDetailed) => {
        const divCard = createDOMElem('div', 'card');
        const divCardBody = createDOMElem('div', 'card-body');
        const h5 = createDOMElem('h5', 'card-title', show.name);
        const btn = createDOMElem('button', 'btn btn-primary', 'Show details');
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
                console.log(show._embedded.cast.length);
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

        if (isDetailed) {
            btn.addEventListener('click', this.closeDetailsView);
        } else {
            btn.addEventListener('click', this.openDetailsView);
        }
        

        divCard.appendChild(divCardBody);
        divCardBody.appendChild(img);
        divCardBody.appendChild(h5);
        divCardBody.appendChild(h6);
        divCardBody.appendChild(p);
        divCardBody.appendChild(btn);

        return divCard;
    }
}

document.addEventListener("DOMContentLoaded", new TvMaze());