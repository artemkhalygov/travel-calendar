import moment from 'moment'
import each from 'lodash/each'
import map from 'lodash/map'
import debounce from 'lodash/debounce'
import './calendar.sass'

const enumerateDaysBetweenDates = function(startDate, endDate) {
	var now = startDate.clone(),
		dates = [];

	while (now.isSameOrBefore(endDate)) {
		dates.push(now.format('YYYY-MM-DD'));
		now.add(1, 'days');
	}
	return dates;
}

const getOffsetRect = function(elem) {
    let box = elem.getBoundingClientRect(),
     	body = document.body,
     	docElem = document.documentElement,
     	scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
     	scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
     	clientTop = docElem.clientTop || body.clientTop || 0,
     	clientLeft = docElem.clientLeft || body.clientLeft || 0,
     	top  = box.top +  scrollTop - clientTop,
     	left = box.left + scrollLeft - clientLeft

    return { top: Math.round(top), left: Math.round(left) }
}

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}


class TravelCalendar {
	constructor({
		element,
		monthNumber,
		startOfWeek = 1,
		dateFrom,
		dateTo,
		rangePicker,
		onSelectDates,
		onMonthChange,
		availableDates
	}) {
		this.element = element
		this.monthNumber = monthNumber
		this.calendarId = getRandomInt(1000000, 9999999999)
		this.userLocale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language || navigator.browserLanguage || 'en'
		this.isVisible = false

		this.dateFrom = dateFrom ? moment(dateFrom) : null
		this.dateTo = rangePicker && dateTo ? moment(dateTo) : null

		this.rangePicker = rangePicker
		this.availableDates = availableDates
		this.onMonthChange = onMonthChange
		this.horizontalScrollPosition = 0

		moment.locale(this.userLocale)

		this.calendarContainer = document.getElementById(`travel-calendar-${this.calendarId}`)

		if (typeof onSelectDates === 'function') {
			this.onSelectDates = onSelectDates
		}

		if ('ontouchstart' in window) {
			this.element.setAttribute('readonly', 'true')
		}
		
		this.renderCalendar()

		if (this.element) {
			this.element.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('L') : ''
			this.element.addEventListener('click', this.show.bind(this))
		}

	}

	show() {
		const calendar = document.getElementById(`travel-calendar-${this.calendarId}`)
		const position = getOffsetRect(this.element)


		if (window.innerWidth > 1024) {
			if (position.left + calendar.clientWidth >= window.innerWidth) {
				let positionLeft = position.left - calendar.clientWidth + this.element.clientWidth + 20

				if (positionLeft <= 0) {
					positionLeft = position.left - calendar.clientWidth / 2 + this.element.clientWidth + 20
					calendar.classList.add('center-align')
					calendar.classList.remove('right-align')
				} else {
					calendar.classList.remove('center-align')
					calendar.classList.add('right-align')
				}

				position.left = positionLeft
			} else {
				calendar.classList.remove('right-align','center-align')
			}

			calendar.style.top = position.top + document.body.scrollTop - 8 + 'px'
			calendar.style.left = position.left + document.body.scrollLeft - 10 + 'px'
		} else {
			document.body.classList.add('calendar-expanded')
			calendar.classList.remove('right-align','center-align')
		}
		
		calendar.classList.add('visible')
		

		setTimeout(() => {
			this.isVisible = true

			if (this.dateFrom || this.dateTo) {
				let selectedDate = document.querySelector(`#travel-calendar-${this.calendarId} .utmost`)
				const arrowLeft = document.getElementById(`travel-calendar-arrow-left-${this.calendarId}`)
				const arrowRight = document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`)

				if (!selectedDate) {
					return false
				}

				if (window.innerWidth <= 1024) {
					document.getElementById(`calendar-monthes-wrapper-${this.calendarId}`).scrollTop = selectedDate.parentElement.parentElement.offsetTop - 70
				} else {
					this.horizontalScrollPosition = Math.abs(moment().diff(moment(selectedDate.dataset.date).endOf('month'),'M')) - 1

					if (this.horizontalScrollPosition >= 0) {
						document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`).click()
						arrowLeft.classList.remove('disabled')
					} else {
						this.horizontalScrollPosition = 0
						arrowLeft.classList.add('disabled')
						arrowRight.classList.remove('disabled')
						document.getElementById('travel-monthes').style.transform = 'translate3d(0px, 0px, 0px)'
					}
				}
			}
		}, 150)
	}

	hide() {
		this.isVisible = false

		document.body.classList.remove('calendar-expanded')
		document.getElementById(`travel-calendar-${this.calendarId}`).classList.remove('visible')
	}

	updateDates(dateFrom, dateTo) {
		this.dateFrom = dateFrom ? moment(dateFrom) : null
		this.dateTo = dateTo ? moment(dateTo) : null

		this.renderCalendar()
	}

	renderCalendar() {
		if (!this.calendarContainer) {
			let i = 0;
			let monthes = [];
			let groupedMonthes = [];
			const startDay = moment().startOf('month');
			// const endDay = moment().add(24,'m').endOf('month');

			while (this.monthNumber > i) {
				let month = moment(startDay).add(i, 'M')
				let startOfMonth = moment(month).startOf('month')
				let endOfMonth = moment(month).endOf('month')
				let group = enumerateDaysBetweenDates(startOfMonth, endOfMonth).reduce(function(acc, date) {
					var yearWeek = moment(date).year() + '-' + moment(date).isoWeek();
					// check if the week number exists
					if (typeof acc[yearWeek] === 'undefined') {
						acc[yearWeek] = [];
					}

					acc[yearWeek].push(date);

					return acc;

				}, {});

				groupedMonthes.push(group)

				i++;
			}

			let template = `<div class="travel-calendar" id="travel-calendar-${this.calendarId}">
				<div class="travel-calendar__container" id="travel-calendar-container-${this.calendarId}">
					<div class="travel-calendar__arrow arrow-right" id="travel-calendar-arrow-right-${this.calendarId}">&#8250;</div>
					<div class="travel-calendar__arrow arrow-left" id="travel-calendar-arrow-left-${this.calendarId}">&#8249;</div>
					<div class="travel-calendar__header">
						<div class="travel-calendar__input-container">
							<input class="travel-calendar__input" placeholder="Date from" readonly="true" id="travelFrom-${this.calendarId}">
							${ this.rangePicker ? `<input class="travel-calendar__input" placeholder="Date to" readonly="true" id="travelTo-${this.calendarId}">` : '' }
						</div>
						<div class="travel-calendar-days-of-week">
							<div class="travel-calendar-week">
								<div class="travel-calendar-day">Mon</div>
								<div class="travel-calendar-day">Tue</div>
								<div class="travel-calendar-day">Wed</div>
								<div class="travel-calendar-day">Thu</div>
								<div class="travel-calendar-day">Fri</div>
								<div class="travel-calendar-day">Sat</div>
								<div class="travel-calendar-day">Sun</div>
							</div>
						</div>
					</div>
					<div class="travel-calendar-monthes-wrapper" id="calendar-monthes-wrapper-${this.calendarId}">
						<div class="travel-calendar-monthes" id="travel-monthes-${this.calendarId}">`

			each(map(groupedMonthes), (month, key) => {
				let currentMonth = moment(map(month)[0][0])
				template += `<div class="travel-calendar-month">
					<p class="month-name">${ currentMonth.locale('en').format('MMMM') } ${ currentMonth.format('YYYY') !== moment().format('YYYY') ? currentMonth.format('YYYY') : ''}</p>
					<div class="travel-calendar-week week-days">
						<div class="travel-calendar-day">M</div>
						<div class="travel-calendar-day">T</div>
						<div class="travel-calendar-day">W</div>
						<div class="travel-calendar-day">T</div>
						<div class="travel-calendar-day">F</div>
						<div class="travel-calendar-day">S</div>
						<div class="travel-calendar-day">S</div>
					</div>`

				each(month, (week) => {
					template += '<div class="travel-calendar-week">'

					let firstDayOfWeek = moment(week[0]).isoWeekday()

					if (firstDayOfWeek !== 1) {
						let emptyDates = new Array(firstDayOfWeek - 1)

						each(emptyDates, function() {
						 	template += '<div class="travel-calendar-day">&nbsp;</div>'
						})
					}

					each(week, (day) => {
						let momentDay = moment(day),
							onlyDate = momentDay.format('D')

						template += '<div class="travel-calendar-day'

						if (this.availableDates) {
							each(this.availableDates, function(val) {
								if (val.date === day) {
									if (val.isAvailable === true) {
										template += ' available'
									} else if (val.isAvailable === false) {
										template += ' not-available'
									} else {
										template += ' no-info'
									}
								}
							})
						}

						if (momentDay < moment().startOf('d')) {
							template += ' disabled'
						} else {
							template += ' clickable'
						}

						template += `" data-date="${day}"><span>${onlyDate}</span>
							${ moment(momentDay).startOf('M').format('D') === onlyDate ? '<div class="blured-element blured-element__start"></div>' : ''}
							${ moment(momentDay).endOf('M').format('D') === onlyDate ? '<div class="blured-element blured-element__end"></div>' : ''}
						</div>`
					})
					template += '</div>'
				})
				template += '</div>'
			})

			template += `</div></div>
				<div class="travel-calendar__footer">
					<button class="travel-calendar__btn grey-btn" id="cancel-btn-${this.calendarId}">Clear</button>
					<button class="travel-calendar__btn blue-btn" id="save-btn-${this.calendarId}">Select</button>
				</div>
			  </div>
			</div>`

			const elem = document.createElement('div')

			elem.setAttribute('id', 'calendar')
			elem.innerHTML = template

			document.body.appendChild(elem)

			document.addEventListener('click', (e) => {
				if (!elem.contains(e.target) && this.isVisible) {
					this.saveDates()
				}
			})

			document.getElementById(`cancel-btn-${this.calendarId}`).addEventListener('click', this.clearDates.bind(this));

			document.getElementById(`save-btn-${this.calendarId}`).addEventListener('click', this.saveDates.bind(this));

			const travelMonthes = document.getElementById(`travel-monthes-${this.calendarId}`)
			const CONTAINER_WIDTH = 360

			const arrowRight = document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`)
			const arrowLeft = document.getElementById(`travel-calendar-arrow-left-${this.calendarId}`)

			arrowRight.addEventListener('click', (e) => {
				this.horizontalScrollPosition += 1

				arrowLeft.classList.remove('disabled')

				if (this.horizontalScrollPosition == this.monthNumber - 2) {
					e.target.classList.add('disabled')
				}

				if (this.horizontalScrollPosition > this.monthNumber - 2) {
					return this.horizontalScrollPosition = this.monthNumber - 2
				}

				// if (this.onMonthChange)
					// console.log(moment().add(this.horizontalScrollPosition + 1,'M').format('MMM'))
					// console.log(this.horizontalScrollPosition)

				travelMonthes.style.transform = `translate3d(-${CONTAINER_WIDTH * this.horizontalScrollPosition}px, 0px, 0px)`;
			})

			arrowLeft.addEventListener('click', (e) => {
				if (this.horizontalScrollPosition < 2) {
					e.target.classList.add('disabled')
				}

				if (this.horizontalScrollPosition < 1) {
					return this.horizontalScrollPosition = 0
				}

				arrowRight.classList.remove('disabled')

				this.horizontalScrollPosition -= 1
				travelMonthes.style.transform = `translate3d(-${CONTAINER_WIDTH * this.horizontalScrollPosition}px, 0px, 0px)`;


				if (this.onMonthChange)
					this.onMonthChange()
			})

			this.calendarContainer = document.getElementById(`travel-calendar-${this.calendarId}`)

			window.addEventListener('resize', () => {
				if (window.innerWidth <= 1024) {
					this.horizontalScrollPosition = 0
					travelMonthes.style.transform = ''
					this.calendarContainer.style.top = ''
					this.calendarContainer.style.left = ''
				} else {
					document.body.classList.remove('calendar-expanded')
				}
			})

			if (window.innerWidth <= 1024) {
				const calendarMonthWrapper = document.getElementById(`calendar-monthes-wrapper-${this.calendarId}`)

				calendarMonthWrapper.addEventListener('scroll', (e) => {
					debounce(() => {
						console.log(e.target.scrollTop, calendarMonthWrapper.clientHeight)
					}, 150)
				})
			}
		}

		this.allDatesHTML = document.querySelectorAll(`#travel-calendar-${this.calendarId} .travel-calendar-day.clickable`)
		this.dateFromInput = document.getElementById(`travelFrom-${this.calendarId}`)
		this.dateToInput = document.getElementById(`travelTo-${this.calendarId}`)

		each(this.allDatesHTML, (elem) => {
			return elem.addEventListener('click', (e) => { this.clickEvent(elem.dataset.date) });
		})
		

		if (this.dateFrom || this.dateTo) {
			this.highlightSelectedDate()
		}

	}

	clearDates() {
		this.dateFrom = null
		this.dateTo = null

		this.highlightSelectedDate()
	}

	saveDates() {
		if (this.onSelectDates) {
			let selectedDates = {
				dateFrom: this.dateFrom ? this.dateFrom.format('YYYY-MM-DD') : null,
				dateFromFormatted: this.dateFrom ? this.dateFrom.format('L') : null
			}

			if (this.rangePicker) {
				selectedDates.dateTo = this.dateTo ? this.dateTo.format('YYYY-MM-DD') : null
				selectedDates.dateToFormatted = this.dateTo ? this.dateFrom.format('L') : null
			}

			this.onSelectDates(selectedDates)
			this.hide()
		}
	}

	clickEvent(datasetDate) {
		if (!datasetDate) {
			return 0
		}

		let date = moment(datasetDate)

		if (!this.dateFrom)  {
			this.dateFrom = date
		} else if (this.rangePicker) {
			if (this.dateFrom && !this.dateTo) {
				if (this.dateFrom < date) {
					this.dateTo = date
				} else {
					this.dateFrom = date
				}
			} else if (this.dateFrom && this.dateTo) {
				this.dateFrom = date
				this.dateTo = null
			}
		} else {
			this.dateFrom = date
		}

		this.highlightSelectedDate()
	}

	highlightSelectedDate() {
		let dateFromFormatted = this.dateFrom ? this.dateFrom.format('YYYY-MM-DD') : null,
			dateToFormatted = this.dateTo && this.dateTo.format('YYYY-MM-DD')

		each(this.allDatesHTML, (val) => {
			let currentValue = val.dataset.date,
				momentDate = moment(currentValue)

			if (dateFromFormatted && currentValue === dateFromFormatted) {
				val.classList.add('selected', 'utmost')

				if (dateToFormatted) {
					val.classList.add('utmost-right')
				}
			} else if (dateToFormatted && currentValue === dateToFormatted) {
				val.classList.add('selected', 'utmost')

				if (dateFromFormatted) {
					val.classList.add('utmost-left')
				}
			} else if (this.dateFrom && this.dateTo && momentDate.isBetween(this.dateFrom, this.dateTo, 'days')) {
				val.classList.add('selected')
			} else {
				val.classList.remove('selected','utmost', 'utmost-right', 'utmost-left')
			}
		});

		this.dateFromInput.value = this.dateFrom ? this.dateFrom.format('L') : ''

		if (this.rangePicker) {
			this.dateToInput.value = this.dateTo ? this.dateTo.format('L') : ''
		}
	}

	updateAvailableDates(dates) {
		each(dates, (val) => {
			const dateElement = document.querySelector(`#travel-calendar-${this.calendarId} [data-date="${val.date}"]`)

			if (dateElement) {
				dateElement.classList.remove('available', 'not-available', 'no-info')

				if (val.isAvailable) {
					dateElement.classList.add('available')
				} else if (val.isAvailable === false) {
					dateElement.classList.add('not-available')
				} else {
					dateElement.classList.add('no-info')
				}
			}
		})
	}
}

// const availableDates = [{
// 	date: '2018-09-26',
// 	isAvailable: true
// },{
// 	date: '2018-09-27',
// 	isAvailable: true
// },{
// 	date: '2018-09-28',
// 	isAvailable: true
// },{
// 	date: '2018-09-29',
// 	isAvailable: true
// },{
// 	date: '2018-09-30',
// 	isAvailable: false
// },{
// 	date: '2018-10-01',
// 	isAvailable: true
// },{
// 	date: '2018-10-02',
// 	isAvailable: false
// },{
// 	date: '2018-10-03',
// 	isAvailable: null
// }]

// var calendar = new TravelCalendar({
// 	element: document.getElementById('dateFrom'),
// 	dateFrom: '2019-09-14',
// 	monthNumber: 24,
// 	onSelectDates: function(dates) { 
// 		document.getElementById('dateFrom').value = dates.dateFrom
// 		document.getElementById('dateTo').value = dates.dateTo
// 	},
// 	// availableDates,
// 	onMonthChange: function() {console.log(1)},
// 	rangePicker: false
// })

// var calendar2 = new TravelCalendar({
// 	element: document.getElementById('dateTo'),
// 	dateFrom: '2019-08-17',
// 	monthNumber: 24,
// 	onSelectDates: function(dates) { 
// 		document.getElementById('dateFrom').value = dates.dateFrom
// 		document.getElementById('dateTo').value = dates.dateTo
// 	},
// 	// availableDates,
// 	onMonthChange: function() {console.log(1)},
// 	rangePicker: true
// })

window.TravelCalendar = TravelCalendar


// document.getElementById('dateFrom').addEventListener('click', calendar.show.bind(calendar))

