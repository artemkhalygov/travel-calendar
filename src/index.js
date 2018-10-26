import moment from 'moment'
import each from 'lodash/each'
import map from 'lodash/map'

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

const elementInViewport = function (el) {
  var top = el.offsetTop;
  var left = el.offsetLeft;
  var width = el.offsetWidth;
  var height = el.offsetHeight;

  while(el.offsetParent) {
    el = el.offsetParent;
    top += el.offsetTop;
    left += el.offsetLeft;
  }

  return (
    top >= window.pageYOffset &&
    left >= window.pageXOffset &&
    (top + height) <= (window.pageYOffset + window.innerHeight) &&
    (left + width) <= (window.pageXOffset + window.innerWidth)
  )
}

const getOffsetRect = function(elem) {
	let box = elem.getBoundingClientRect(),
		body = document.body,
		docElem = document.documentElement,
		scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
		scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
		clientTop = docElem.clientTop || body.clientTop || 0,
		clientLeft = docElem.clientLeft || body.clientLeft || 0,
		top = box.top + scrollTop - clientTop,
		left = box.left + scrollLeft - clientLeft

	return {
		top: Math.round(top),
		left: Math.round(left)
	}
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
		dateToInputId,
		rangePicker,
		onSelectDates,
		onMonthChange,
		availableDates,
		showLegend,
		language,
		dateFromLabel,
		dateToLabel,
		minDuration,
		maxDuration,
		showDuration
	}) {
		this.element = element

		if (dateToInputId) {
			this.elementTo = document.getElementById(dateToInputId)
		}

		this.monthNumber = monthNumber
		this.calendarId = getRandomInt(1000000, 9999999999)
		this.userLocale = language || this.userLocale
		this.isVisible = false

		this.dateFrom = dateFrom ? moment(dateFrom) : null
		this.dateTo = rangePicker && dateTo ? moment(dateTo) : null

		this.dateFromLabel = dateFromLabel || 'From'
		this.dateToLabel = dateToLabel || 'To'

		this.minDuration = minDuration || 0
		this.maxDuration = maxDuration || 21

		this.showLegend = showLegend
		this.showDuration = showDuration

		this.rangePicker = rangePicker
		this.availableDates = availableDates
		this.onMonthChange = onMonthChange
		this.horizontalScrollPosition = 0
		this.isTouch = 'ontouchstart' in window
		this.hasError = false

		moment.locale(this.userLocale)

		this.calendarContainer = document.getElementById(`travel-calendar-${this.calendarId}`)
		this.onSelectDates = onSelectDates

		this.renderCalendar()

		if (this.element) {
			this.element.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : ''
			this.element.addEventListener('click', this.show.bind(this))

			
			if (this.isTouch) {
				this.element.setAttribute('readonly', 'true')

				if (this.elementTo) {
					this.elementTo.setAttribute('readonly', 'true')
				}
			}
		}

		if (this.elementTo) {
			this.elementTo.value = this.dateTo ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : ''
			this.elementTo.addEventListener('click', this.show.bind(this))
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
				calendar.classList.remove('right-align', 'center-align')
			}

			calendar.style.top = position.top + document.body.scrollTop - 8 + 'px'
			calendar.style.left = position.left + document.body.scrollLeft - 10 + 'px'

			if (elementInViewport(this.saveBtn) === false) {
				window.scrollTo({
				  top: position.top - 100,
				  behavior: 'smooth',
				})
			}
		} else {
			document.body.classList.add('calendar-expanded')
			calendar.classList.remove('right-align', 'center-align')
		}

		calendar.classList.add('visible')


		setTimeout(() => {
			this.isVisible = true
			this.scrollToDate()
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

				let listOfWeekDays = moment.weekdaysMin(true)

				let template = `
				<div class="travel-calendar__container" id="travel-calendar-container-${this.calendarId}">
					<div class="travel-calendar__arrow arrow-right" id="travel-calendar-arrow-right-${this.calendarId}">&#8250;</div>
					<div class="travel-calendar__arrow arrow-left" id="travel-calendar-arrow-left-${this.calendarId}">&#8249;</div>
					<div class="travel-calendar__header">
						<div class="travel-calendar__input-container">
							<label>${ this.dateFromLabel }</label>
							<input class="travel-calendar__input" placeholder="${ this.dateFromLabel }" autocomplete="false" ${this.isTouch ? 'readonly="true"' : ''} id="travelFrom-${this.calendarId}">
							${ this.rangePicker ? `
								<label>${ this.dateToLabel }</label>
								<input class="travel-calendar__input" autocomplete="false" placeholder="${ this.dateToLabel }" ${this.isTouch ? 'readonly="true"' : ''} id="travelTo-${this.calendarId}">` : '' }
							${ this.showDuration  ? `<span class="travel-calendar__duration-text-container" id="travel-duration-${this.calendarId}"></span>` : '' }
						</div>
						<div class="travel-calendar-days-of-week">
							<div class="travel-calendar-week">`
							each(listOfWeekDays, (val) => {
								template += `<div class="travel-calendar-day">${ val.toLocaleUpperCase() }</div>`
							})
		
							template += `
							</div>
						</div>
					</div>
					<div class="travel-calendar-monthes-wrapper" id="calendar-monthes-wrapper-${this.calendarId}">
						<div class="travel-calendar-monthes" id="travel-monthes-${this.calendarId}">`

			each(map(groupedMonthes), (month, key) => {
				let currentMonth = moment(map(month)[0][0])
				template += `<div class="travel-calendar-month">
					<p class="month-name">${ currentMonth.format('MMMM') } ${ currentMonth.format('YYYY') !== moment().format('YYYY') ? currentMonth.format('YYYY') : ''}</p>
					<div class="travel-calendar-week week-days">`

					each(listOfWeekDays, (val) => {
						template += `<div class="travel-calendar-day">${ val.substr(0,1).toLocaleUpperCase() }</div>`
					})

					template += '</div>'

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
				<div class="travel-calendar__error">
					<p id="calendar-error-${this.calendarId}"></p>
				</div>
				<div class="travel-calendar__footer">`
				if (this.showLegend) {
					template += `<div class="legend" fixed-position-tooltip="fixed-position-tooltip" child=".legend-available .info-icon">
						<div class="legend-available">Room available</div>
						<div class="legend-sold-out">Room sold-out</div>
						<div class="legend-no-info">No prices &amp; availability</div>
					</div>`
				}
					
				template += `<button class="travel-calendar__btn grey-btn" id="cancel-btn-${this.calendarId}">Clear</button>
					<button class="travel-calendar__btn blue-btn" id="save-btn-${this.calendarId}">Select</button>
				</div>
			  </div>`

			const elem = document.createElement('div')

			elem.setAttribute('id', `travel-calendar-${this.calendarId}`)
			elem.setAttribute('class', 'travel-calendar')
			elem.innerHTML = template

			document.body.appendChild(elem)

			document.addEventListener('mousedown', (e) => {
				if (!elem.contains(e.target) && this.isVisible) {
					this.saveDates()
				}
			})

			this.calendarError = document.getElementById(`calendar-error-${this.calendarId}`)

			if (this.showDuration) {
				this.durationText = document.getElementById(`travel-duration-${this.calendarId}`)
			}

			document.getElementById(`cancel-btn-${this.calendarId}`).addEventListener('click', this.clearDates.bind(this));

			this.saveBtn = document.getElementById(`save-btn-${this.calendarId}`)
			
			this.saveBtn.addEventListener('click', this.saveDates.bind(this));

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

			// if (window.innerWidth <= 1024) {
			// 	const calendarMonthWrapper = document.getElementById(`calendar-monthes-wrapper-${this.calendarId}`)

			// 	calendarMonthWrapper.addEventListener('scroll', (e) => {
			// 		debounce(() => {
			// 			console.log(e.target.scrollTop, calendarMonthWrapper.clientHeight)
			// 		}, 150)
			// 	})
			// }

			this.allDatesHTML = document.querySelectorAll(`#travel-calendar-${this.calendarId} .travel-calendar-day.clickable`)
			this.dateFromInput = document.getElementById(`travelFrom-${this.calendarId}`)
			this.dateToInput = document.getElementById(`travelTo-${this.calendarId}`)

			each(this.allDatesHTML, (elem) => {
				return elem.addEventListener('click', (e) => { this.clickEvent(elem.dataset.date) });
			})

			if (this.isTouch === false) {
				this.dateFromInput.onchange = (e) => {
					let isValid = false
					
					if (this.dateFromInput.value) {
						let date = moment(this.dateFromInput.value)

						if (!date._isValid) {
							date = moment(this.dateFromInput.value, moment.localeData()._longDateFormat.L)
						}
						
						if (date._isValid && date >= moment() && date <= moment().add(this.monthNumber,'M')) {
							this.dateFrom = date
							isValid = true

							if (this.dateTo && date >= this.dateTo) {
								this.dateTo = null
								this.dateToInput.value = null
							}
						}
					}

					if (isValid) {
						this.highlightSelectedDate()
						this.scrollToDate()
					} else {
						this.dateFromInput.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : null
					}
				}

				if (this.dateToInput) {
					this.dateToInput.onchange = (e) => {
						let isValid = false

						if (this.dateToInput.value) {
							let date = moment(this.dateToInput.value)

							if (!date._isValid) {
								date = moment(this.dateToInput.value, moment.localeData()._longDateFormat.L)
							}
							
							if (date._isValid && date >= moment() && date <= moment().add(this.monthNumber,'M')) {
								this.dateTo = date
								isValid = true

								if (this.dateFrom && date <= this.dateFrom) {
									this.dateTo = null
								}
							}
						}


						if (isValid) {
							this.highlightSelectedDate()
							this.scrollToDate()
						} else {
							this.dateToInput.value = this.dateTo ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : null
						}
					}
				}
			}
		}
		

		if (this.dateFrom || this.dateTo) {
			this.highlightSelectedDate()
		}

	}

	scrollToDate() {
		if (this.dateFrom || this.dateTo) {
			let selectedDate = document.querySelector(`#travel-calendar-${this.calendarId} .utmost`)
			const arrowLeft = document.getElementById(`travel-calendar-arrow-left-${this.calendarId}`)
			const arrowRight = document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`)

			if (!selectedDate) {
				return false
			}

			if (window.innerWidth <= 1024) {
				document.getElementById(`calendar-monthes-wrapper-${this.calendarId}`).scrollTop = selectedDate.parentElement.parentElement.offsetTop - 80
			} else {
				this.horizontalScrollPosition = Math.abs(moment().diff(moment(selectedDate.dataset.date).endOf('month'),'M')) - 1

				if (this.horizontalScrollPosition >= 0) {
					document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`).click()
					arrowLeft.classList.remove('disabled')
				} else {
					this.horizontalScrollPosition = 0
					arrowLeft.classList.add('disabled')
					arrowRight.classList.remove('disabled')
					document.getElementById(`travel-monthes-${this.calendarId}`).style.transform = 'translate3d(0px, 0px, 0px)'
				}
			}
		}
	}

	clearDates() {
		this.dateFrom = null
		this.dateTo = null

		this.highlightSelectedDate()
	}

	saveDates() {
		let selectedDates = {
			dateFrom: this.dateFrom ? this.dateFrom.locale(this.userLocale).format('YYYY-MM-DD') : null,
			dateFromFormatted: this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : null
		}

		if (this.rangePicker) {
			selectedDates.dateTo = this.dateTo && !this.hasError ? this.dateTo.locale(this.userLocale).format('YYYY-MM-DD') : null
			selectedDates.dateToFormatted = this.dateTo && !this.hasError ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : null
		}

		if (this.onSelectDates) {
			this.onSelectDates(selectedDates)
		}
		this.hide()
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
					if (this.minDuration || this.maxDuration) {
						let diff = date.diff(this.dateFrom,'d')
						if (this.maxDuration >= diff && this.minDuration <= diff) {
							this.saveBtn.removeAttribute('disabled')
							this.calendarError.innerHTML = ''
							this.hasError = false

							if (this.showDuration) {
								this.durationText.innerHTML = `${ diff } nights`
							}
						} else {
							this.saveBtn.setAttribute('disabled', 'true')
							this.hasError = true
							this.calendarError.innerHTML = `Minimal duration ${this.minDuration} days. Maximum duration ${this.maxDuration} days.`

							if (this.showDuration) {
								this.durationText.innerHTML = ''
							}
						}
					}

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

	updateDurationText(text) {
		this.durationText.innerHTML = text
	}

	highlightSelectedDate() {
		let dateFromFormatted = this.dateFrom ? this.dateFrom.format('YYYY-MM-DD') : null,
			dateToFormatted = this.dateTo && this.dateTo.format('YYYY-MM-DD')

		each(this.allDatesHTML, (val) => {
			let currentValue = val.dataset.date,
				momentDate = moment(currentValue)

			val.classList.remove('selected','utmost', 'utmost-right', 'utmost-left')

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
			}
		});

		this.dateFromInput.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : ''

		if (this.rangePicker) {
			this.dateToInput.value = this.dateTo && !this.hasError ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : ''
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
// // }]

// var calendar = new TravelCalendar({
// 	element: document.getElementById('dateFrom'),
// 	dateToInputId: 'dateTo',
// 	dateTo: '',
// 	monthNumber: 24,
// 	onSelectDates: function(dates) { 
// 		// document.getElementById('dateFrom').value = dates.dateFrom
// 		// document.getElementById('dateTo').value = dates.dateTo
// 	},
// 	// availableDates,
// 	onMonthChange: function() {console.log(1)},
// 	rangePicker: true,
// 	language: 'en',
// 	minDuration: 3,
// 	maxDuration: 21,
// 	showLegend: true,
// 	showDuration: true
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