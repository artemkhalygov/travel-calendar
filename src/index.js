// import moment from 'moment'
// import _.each from 'lodash/_.each'
// import _.map from 'lodash/_.map'

import './calendar.sass'

const enumerateDaysBetweenDates = function(startDate, endDate) {
  var now = startDate.clone();
    var dates = []

  while(now.isSameOrBefore(endDate)) {
    dates.push(now.format('YYYY-MM-DD'))
    now.add(1, 'days')
  }
  return dates
}

const elementInViewport = function(el) {
  var top = el.offsetTop
  var left = el.offsetLeft
  var width = el.offsetWidth
  var height = el.offsetHeight

  while(el.offsetParent) {
    el = el.offsetParent
    top += el.offsetTop
    left += el.offsetLeft
  }

  return (
    top >= window.pageYOffset &&
    left >= window.pageXOffset &&
    (top + height) <= (window.pageYOffset + window.innerHeight) &&
    (left + width) <= (window.pageXOffset + window.innerWidth)
  )
}

const getOffsetRect = function(elem) {
  let box = elem.getBoundingClientRect();
    let body = document.body;
    let docElem = document.documentElement;
    let scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    let scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    let clientTop = docElem.clientTop || body.clientTop || 0;
    let clientLeft = docElem.clientLeft || body.clientLeft || 0;
    let top = box.top + scrollTop - clientTop;
    let left = box.left + scrollLeft - clientLeft

  return {
    top: Math.round(top),
    left: Math.round(left),
  }
}

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min
}

class TravelCalendar {
  constructor({
    element,
    monthNumber,
    startOfWeek = 1,
    pricesData,
    availableWeekDays,
    dateFrom,
    dateTo,
    dateToInputId,
    rangePicker,
    onSelectDates,
    onMonthChange,
    availableDates,
    availableRange,
    possibleDateRange,
    showLegend,
    language,
    dateFromLabel,
    dateToLabel,
    minDuration,
    maxDuration,
    showDuration,
    roomAvailableLabel,
    roomSoldOutLabel,
    roomNoInfoLabel,
    possibleStartDateLabel,
    possibleEndDateLabel,
    selectBtnLabel,
    clearBtnLabel,
    calendarErrorLabel,
    nightsLabel,
    rangeErrorLabel,
    hideCircles,
    dateErrorLabel,
    hint,
    highlghtedDatesMsg,
    closeBtnLabel,
    isFixedPackage,
    onReady,
    validateStudentsPackage,
    students,
    minDurationForStudents,
  }) {
    this.element = element

    if(dateToInputId) {
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
    this.possibleDateRange = possibleDateRange
    this.onMonthChange = onMonthChange
    this.isFixedPackage = isFixedPackage
    this.horizontalScrollPosition = 0
    this.isTouch = 'ontouchstart' in window
    this.hasError = false

    this.roomAvailableLabel = roomAvailableLabel
    this.roomSoldOutLabel = roomSoldOutLabel
    this.roomNoInfoLabel = roomNoInfoLabel
    this.selectBtnLabel = selectBtnLabel
    this.clearBtnLabel = clearBtnLabel
    this.calendarErrorLabel = calendarErrorLabel
    this.nightsLabel = nightsLabel
    this.possibleStartDateLabel = possibleStartDateLabel
    this.possibleEndDateLabel = possibleEndDateLabel

    this.hint = hint
    this.hideCircles = hideCircles

    this.rangeErrorLabel = rangeErrorLabel
    this.dateErrorLabel = dateErrorLabel
    this.highlghtedDatesMsg = highlghtedDatesMsg

    this.availableWeekDays = availableWeekDays
    this.availableRange = availableRange
    this.closeBtnLabel = closeBtnLabel
    this.pricesData = pricesData
    this.validateStudentsPackage = validateStudentsPackage
    this.students = students
    this.minDurationForStudents = minDurationForStudents
    this.onReady = onReady
    
    moment.locale(this.userLocale)

    moment.updateLocale(this.userLocale, {
		  week: {
		    dow: 1,
		  },
    })

    this.calendarContainer = document.getElementById(`travel-calendar-${this.calendarId}`)
    this.onSelectDates = onSelectDates

    this.renderCalendar()

    if(this.element) {
      this.element.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : ''
      this.element.addEventListener('click', this.show.bind(this))

      if(this.isTouch || this.pricesData) {
        this.element.setAttribute('readonly', 'true')

        if(this.elementTo) {
          this.elementTo.setAttribute('readonly', 'true')
        }
      }
    }

    if(this.elementTo) {
      this.elementTo.value = this.dateTo ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : ''
      this.elementTo.addEventListener('click', this.show.bind(this))
    }

    if(typeof this.onReady === 'function') {
      this.onReady()
    }
  }

  show() {
    const calendar = document.getElementById(`travel-calendar-${this.calendarId}`)
    const position = getOffsetRect(this.element)

    if(window.innerWidth > 1024) {
      if(position.left + calendar.clientWidth >= window.innerWidth) {
        let positionLeft = position.left - calendar.clientWidth + this.element.clientWidth + 20

        if(positionLeft <= 0) {
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

      calendar.style.top = position.top - 8 + 'px'
      calendar.style.left = position.left - 10 + 'px'

      if(elementInViewport(this.saveBtn) === false) {
        if(/MSIE|Trident|Edge/.test(window.navigator.userAgent)) {
          window.scrollTo(0, position.top - 100)
        } else {
          window.scrollTo({
					  top: position.top - 100,
					  behavior: 'smooth',
          })
        }
      }
    } else {
      document.documentElement.classList.add('calendar-expanded')
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

    document.documentElement.classList.remove('calendar-expanded')
    document.getElementById(`travel-calendar-${this.calendarId}`).classList.remove('visible')
  }

  updateDates(dateFrom, dateTo) {
    this.dateFrom = dateFrom ? moment(dateFrom) : null
    this.dateTo = dateTo ? moment(dateTo) : null

    this.renderCalendar()
  }

  renderCalendar() {
    if(!this.calendarContainer) {
      let i = 0
      let monthes = []
      let groupedMonthes = []
      const startDay = moment().startOf('month')
      // const endDay = moment().add(24,'m').endOf('month');

      while(this.monthNumber > i) {
        let month = moment(startDay).add(i, 'M')
        let startOfMonth = moment(month).startOf('month')
        let endOfMonth = moment(month).endOf('month')
        let group = enumerateDaysBetweenDates(startOfMonth, endOfMonth).reduce(function(acc, date) {
          var yearWeek = moment(date).year() + '-' + moment(date).isoWeek()
          // check if the week number exists
          if(typeof acc[yearWeek] === 'undefined') {
            acc[yearWeek] = []
          }

          acc[yearWeek].push(date)

          return acc

        }, {})

        groupedMonthes.push(group)

        i++
      }

      let listOfWeekDays = moment.weekdaysMin(true)

      let template = `
				<div class="travel-calendar__backdrop" id="travel-calendar-backdrop-${this.calendarId}"></div>
				<div class="travel-calendar__container" id="travel-calendar-container-${this.calendarId}">
					<div class="travel-calendar__arrow arrow-right" id="travel-calendar-arrow-right-${this.calendarId}">&#8250;</div>
					<div class="travel-calendar__arrow arrow-left" id="travel-calendar-arrow-left-${this.calendarId}">&#8249;</div>
					<div class="travel-calendar__header">
						<div class="travel-calendar__input-container">
							<label>${this.dateFromLabel}</label>
							<input class="travel-calendar__input" placeholder="${this.dateFromLabel}" autocomplete="false" ${this.isTouch || this.isFixedPackage ? 'readonly="true"' : ''} id="travelFrom-${this.calendarId}">
							${this.rangePicker ? `
								<label>${this.dateToLabel}</label>
								<input class="travel-calendar__input" autocomplete="false" placeholder="${this.dateToLabel}" ${this.isTouch || this.isFixedPackage ? 'readonly="true"' : ''} id="travelTo-${this.calendarId}">` : ''}
							${this.showDuration ? `<span class="travel-calendar__duration-text-container" id="travel-duration-${this.calendarId}"></span>` : ''}
						</div>
						<div class="travel-calendar-days-of-week">
							<div class="travel-calendar-week">`
      _.each(listOfWeekDays, (val) => {
        template += `<div class="travel-calendar-day">${val.toLocaleUpperCase()}</div>`
      })

      template += `
							</div>
						</div>
					</div>
          <div class="travel-calendar__error">
            <p id="calendar-error-${this.calendarId}"></p>
          </div>
					<div class="travel-calendar-monthes-wrapper" id="calendar-monthes-wrapper-${this.calendarId}">
						<div class="travel-calendar-monthes" id="travel-monthes-${this.calendarId}">`

      _.each(_.map(groupedMonthes), (month, key) => {
        let currentMonth = moment(_.map(month)[0][0])
        template += `<div class="travel-calendar-month">
					<p class="month-name">${currentMonth.format('MMMM')} ${currentMonth.format('YYYY') !== moment().format('YYYY') ? currentMonth.format('YYYY') : ''}</p>
					<div class="travel-calendar-week week-days">`

        _.each(listOfWeekDays, (val) => {
          template += `<div class="travel-calendar-day">${val.substr(0, 1).toLocaleUpperCase()}</div>`
        })

        template += '</div>'

        _.each(month, (week) => {
          template += '<div class="travel-calendar-week">'

          let firstDayOfWeek = moment(week[0]).isoWeekday()

          if(firstDayOfWeek !== 1) {
            let emptyDates = new Array(firstDayOfWeek - 1)

            _.each(emptyDates, function() {
              template += '<div class="travel-calendar-day">&nbsp;</div>'
            })
          }

          _.each(week, (day) => {
            let momentDay = moment(day);
            let onlyDate = momentDay.format('D')

            template += '<div class="travel-calendar-day'

            if(this.availableDates && !this.pricesData) {
              _.each(this.availableDates, function(val) {
                if(val.date === day) {
                  if(val.isAvailable === true) {
                    template += ' available'
                  } else if(val.isAvailable === false) {
                    template += ' not-available'
                  } else {
                    template += ' no-info'
                  }
                }
              })
            }

            if(this.availableWeekDays) {
              if(this.availableWeekDays.indexOf(momentDay.isoWeekday()) !== -1) {
                template += ' dow-available'
              } else {
                template += ' dow-not-available'
              }
            }

            if(this.pricesData) {
              let priceDataObject = this.pricesData.find((val) => val.date === momentDay.format('YYYY-MM-DD'))
              if(priceDataObject && priceDataObject.itemsLeft > 0) {
                template += this.hideCircles ? 'available' : 'available dow-available'
              } else if(priceDataObject && priceDataObject.itemsLeft === 0) {
                template += ' not-available'
              } else if(!priceDataObject || priceDataObject && priceDataObject.itemsLeft === undefined) {
                template += ' no-info'
              }
            }

            if(momentDay < moment().startOf('d')) {
              template += ' disabled'
            } else {
              template += ' clickable'
            }

            template += `" data-date="${day}"><span>${onlyDate}</span>
							${moment(momentDay).startOf('M').format('D') === onlyDate ? '<div class="blured-element blured-element__start"></div>' : ''}
							${moment(momentDay).endOf('M').format('D') === onlyDate ? '<div class="blured-element blured-element__end"></div>' : ''}
						</div>`
          })
          template += '</div>'
        })
        template += '</div>'
      })

      template += `</div></div>`
      if(this.hint) {
        template += `<div class="travel-calendar__hint">
						<p id="calenar-hint-${this.calendarId}">${this.hint}</p>
					</div>`
      }
      template += `<div class="travel-calendar__footer">`
      if(this.showLegend) {
        template += `<div class="legend" fixed-position-tooltip="fixed-position-tooltip" child=".legend-available .info-icon">
						<div>
							<div class="legend-available">${this.roomAvailableLabel || 'Room available'}</div>
							<div class="legend-sold-out">${this.roomSoldOutLabel || 'Room sold-out'}</div>
							<div class="legend-no-info">${this.roomNoInfoLabel || 'No prices &amp; availability'}</div>
						</div>`

        if(this.isFixedPackage) {
          template += `
							<div class="fixed-legend-container">
								<div class="legend-start-date">${this.possibleStartDateLabel || 'Possible start date'}</div>
								<div class="legend-end-date">${this.possibleEndDateLabel || 'Possible start date'}</div>
							</div>`
        }

        template += '</div>'
      }

      template += `
					<span class="travel-calendar__btn close-btn " id="close-btn-${this.calendarId}">${this.closeBtnLabel || 'Close'}</span>
					<button class="travel-calendar__btn grey-btn" id="cancel-btn-${this.calendarId}">${this.clearBtnLabel || 'Clear'}</button>
					<button class="travel-calendar__btn blue-btn" id="save-btn-${this.calendarId}">${this.selectBtnLabel || 'Select'}</button>
				</div>
			  </div>`

      const elem = document.createElement('div')

      elem.setAttribute('id', `travel-calendar-${this.calendarId}`)
      elem.setAttribute('class', 'travel-calendar')
      elem.innerHTML = template

      document.body.appendChild(elem)

      document.addEventListener('mousedown', (e) => {
        if(!elem.contains(e.target) && this.isVisible) {
          this.saveDates()
        }
      })

      this.calendarError = document.getElementById(`calendar-error-${this.calendarId}`)

      if(this.showDuration) {
        this.durationText = document.getElementById(`travel-duration-${this.calendarId}`)
      }

      document.getElementById(`cancel-btn-${this.calendarId}`).addEventListener('click', this.clearDates.bind(this))
      document.getElementById(`close-btn-${this.calendarId}`).addEventListener('click', this.hide.bind(this))
      document.getElementById(`travel-calendar-backdrop-${this.calendarId}`).addEventListener('click', this.hide.bind(this))
			
      this.saveBtn = document.getElementById(`save-btn-${this.calendarId}`)

      this.saveBtn.addEventListener('click', this.saveDates.bind(this))

      const travelMonthes = document.getElementById(`travel-monthes-${this.calendarId}`)
      const CONTAINER_WIDTH = 360

      const arrowRight = document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`)
      const arrowLeft = document.getElementById(`travel-calendar-arrow-left-${this.calendarId}`)

      arrowRight.addEventListener('click', (e) => {
        this.horizontalScrollPosition += 1

        arrowLeft.classList.remove('disabled')

        if(this.horizontalScrollPosition == this.monthNumber - 2) {
          e.target.classList.add('disabled')
        }

        if(this.horizontalScrollPosition > this.monthNumber - 2) {
          return this.horizontalScrollPosition = this.monthNumber - 2
        }

        // if (this.onMonthChange)
        // console.log(moment().add(this.horizontalScrollPosition + 1,'M').format('MMM'))
        // console.log(this.horizontalScrollPosition)

        travelMonthes.style.transform = `translate3d(-${CONTAINER_WIDTH * this.horizontalScrollPosition}px, 0px, 0px)`
      })

      arrowLeft.addEventListener('click', (e) => {
        if(this.horizontalScrollPosition < 2) {
          e.target.classList.add('disabled')
        }

        if(this.horizontalScrollPosition < 1) {
          return this.horizontalScrollPosition = 0
        }

        arrowRight.classList.remove('disabled')

        this.horizontalScrollPosition -= 1
        travelMonthes.style.transform = `translate3d(-${CONTAINER_WIDTH * this.horizontalScrollPosition}px, 0px, 0px)`


        if(this.onMonthChange)
          {this.onMonthChange()}
      })

      this.calendarContainer = document.getElementById(`travel-calendar-${this.calendarId}`)

      window.addEventListener('resize', () => {
        if(window.innerWidth <= 1024) {
          this.horizontalScrollPosition = 0
          travelMonthes.style.transform = ''
          this.calendarContainer.style.top = ''
          this.calendarContainer.style.left = ''
        } else {
          document.documentElement.classList.remove('calendar-expanded')
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
      this.montherWrapperHTML = document.querySelector(`#travel-calendar-${this.calendarId} .travel-calendar-monthes-wrapper`)
      this.dateFromInput = document.getElementById(`travelFrom-${this.calendarId}`)
      this.dateToInput = document.getElementById(`travelTo-${this.calendarId}`)

      _.each(this.allDatesHTML, (elem) => {
        return elem.addEventListener('click', (e) => { this.clickEvent(elem.dataset.date) })
      })

      if(this.isTouch === false) {
        this.dateFromInput.onchange = (e) => {
          let isValid = false

          if(this.dateFromInput.value) {
            let date = moment(this.dateFromInput.value)

            if(!date._isValid) {
              date = moment(this.dateFromInput.value, moment.localeData()._longDateFormat.L)
            }

            if(date._isValid && date >= moment() && date <= moment().add(this.monthNumber, 'M')) {
              this.dateFrom = date
              isValid = true

              if(this.dateTo && date >= this.dateTo) {
                this.dateTo = null
                this.dateToInput.value = null
              }
            }
          }

          if(isValid) {
            this.highlightSelectedDate()
            this.scrollToDate()
          } else {
            this.dateFromInput.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : null
          }
        }

        if(this.dateToInput) {
          this.dateToInput.onchange = (e) => {
            let isValid = false

            if(this.dateToInput.value) {
              let date = moment(this.dateToInput.value)

              if(!date._isValid) {
                date = moment(this.dateToInput.value, moment.localeData()._longDateFormat.L)
              }

              if(date._isValid && date >= moment() && date <= moment().add(this.monthNumber, 'M')) {
                this.dateTo = date
                isValid = true

                if(this.dateFrom && date <= this.dateFrom) {
                  this.dateTo = null
                }
              }
            }

            if(isValid) {
              this.highlightSelectedDate()
              this.scrollToDate()
            } else {
              this.dateToInput.value = this.dateTo ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : null
            }
          }
        }
      }
    }
    if(this.dateFrom || this.dateTo) {
      this.highlightSelectedDate()
    }
  }

  scrollToDate(scrollToDate) {
    if(this.dateFrom || this.dateTo) {
      let selectedDate = document.querySelector(`#travel-calendar-${this.calendarId} ${scrollToDate || '.utmost'}`)
      const arrowLeft = document.getElementById(`travel-calendar-arrow-left-${this.calendarId}`)
      const arrowRight = document.getElementById(`travel-calendar-arrow-right-${this.calendarId}`)

      if(!selectedDate) {
        return false
      }

      if(window.innerWidth <= 1024) {
        document.getElementById(`calendar-monthes-wrapper-${this.calendarId}`).scrollTop = selectedDate.parentElement.parentElement.offsetTop - 80
      } else {
        this.horizontalScrollPosition = Math.abs(moment().diff(moment(selectedDate.dataset.date).endOf('month'), 'M')) - 1

        if(this.horizontalScrollPosition >= 0) {
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
    this.clearHighlightedDates()
  }

  saveDates() {
    let selectedDates = {
      dateFrom: this.dateFrom ? this.dateFrom.locale(this.userLocale).format('YYYY-MM-DD') : null,
      dateFromFormatted: this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : null,
    }

    if(this.rangePicker) {
      selectedDates.dateTo = this.dateTo && !this.hasError ? this.dateTo.locale(this.userLocale).format('YYYY-MM-DD') : null
      selectedDates.dateToFormatted = this.dateTo && !this.hasError ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : null
    }

    if(this.onSelectDates) {
      this.onSelectDates(selectedDates)
    }
    this.hide()
  }

  clickEvent(datasetDate) {
    if(!datasetDate) {
      return 0
    }

    let date = moment(datasetDate)

    if(!this.dateFrom) {
      this.dateFrom = date
      this.validateDateFrom(date)
    } else if(this.rangePicker) {
      if(this.dateFrom && !this.dateTo) {
        if(this.dateFrom < date) {
          let diff = date.diff(this.dateFrom, 'd')
          this.dateTo = date

          if(this.pricesData) {
            let pricingObj = this.pricesData.find((val) => val.date === this.dateFrom.format('YYYY-MM-DD'))
            if(pricingObj && pricingObj.allowedLength.indexOf(diff) !== -1) {
              this.validationHandler(true, '', diff)
              this.clearHighlightedDates()
            } else {
              this.validationHandler(false, this.rangeErrorLabel || `Packages are only available for ${pricingObj.allowedLength} nights. Please choose new dates`)

              this.dateTo = undefined
            }
          } else if(this.minDuration || this.maxDuration) {
            if(this.maxDuration >= diff && this.minDuration <= diff) {
              this.validationHandler(true, '', diff)

              if(this.validateStudentsPackage && this.students > 0) {
                if(diff < this.minDurationForStudents) {
                  this.validationHandler(false, this.calendarStudentsErrorLabel || `Student packages must be 5 nights or longer`, false, false)
                }
              }
            } else {
              this.validationHandler(false, this.calendarErrorLabel || `Minimal duration ${this.minDuration} nights. Maximum duration ${this.maxDuration} nights.`)
            }
          }
        } else {
          this.dateFrom = date
          this.validateDateFrom(date)
        }
      } else if(this.dateFrom && this.dateTo) {
        this.dateFrom = date
        this.dateTo = null
        this.validateDateFrom(date)
      }
    } else {
      this.dateFrom = date
      this.validateDateFrom(date)
      this.clearHighlightedDates()
    }

    this.highlightSelectedDate()
  }

  validateDateFrom(date) {
    if(this.availableWeekDays) {
      if(this.availableWeekDays.indexOf(date.isoWeekday()) !== -1) {
        this.validationHandler(true)
      } else {
        this.validationHandler(false, this.dateErrorLabel || `Package must start on a date highlighted with a circle. Please choose new dates`)
        this.dateFrom = undefined
      }
    }

    if(this.pricesData) {
      let pricingDataInfo = this.pricesData.find((val) => val.date === date.format('YYYY-MM-DD') && val.itemsLeft && val.allowedLength.length)
      if(pricingDataInfo) {
        this.validationHandler(true)

        this.highlightPossibleDates(pricingDataInfo)
        this.scrollToDate('.possible-range-date')
      } else {
        this.validationHandler(false, this.dateErrorLabel || `Package must start on a date highlighted with a circle. Please choose new dates`)
        this.dateFrom = undefined
        this.clearHighlightedDates()
      }
    }
  }

  validationHandler(isValid, msg, diff, setError = true) {
    if(isValid) {
      this.saveBtn.removeAttribute('disabled')
      this.calendarError.innerHTML = ''
      this.calendarError.parentElement.classList.remove('active')
      this.hasError = false

      if(this.showDuration) {
        this.durationText.innerHTML = diff ? `${diff} ${this.nightsLabel || 'nights'}` : ''
      }
    } else {
      if(setError) {
        this.saveBtn.setAttribute('disabled', 'true')
      }
      this.hasError = setError
      this.calendarError.innerHTML = msg
      this.calendarError.parentElement.classList.add('active')

      if(this.showDuration) {
        this.durationText.innerHTML = ''
      }
    }
  }

  updateDurationText(text) {
    this.durationText.innerHTML = text
  }

  highlightPossibleDates(selectedDate) {
    this.montherWrapperHTML.classList.add('highlight-range')
    _.each(this.allDatesHTML, (date) => {
      date.classList.remove('possible-range-date')
    })
    _.each(selectedDate.allowedLength, (range) => {
      let possibleDate = document.querySelector(`#travel-calendar-${this.calendarId} [data-date="${moment(selectedDate.date).add(range, 'd').format('YYYY-MM-DD')}"]`)

      possibleDate.classList.add('possible-range-date')
    })

    this.calendarError.innerHTML = this.highlghtedDatesMsg || 'Please choose one of the highlighted end dates'
    this.hasError = true
    this.calendarError.parentElement.classList.add('active')
  }

  clearHighlightedDates() {
    _.each(this.allDatesHTML, (date) => {
      date.classList.remove('possible-range-date')
    })

    this.montherWrapperHTML.classList.remove('highlight-range')
  }

  highlightSelectedDate() {
    let dateFromFormatted = this.dateFrom ? this.dateFrom.format('YYYY-MM-DD') : null;
      let dateToFormatted = this.dateTo && this.dateTo.format('YYYY-MM-DD')

    _.each(this.allDatesHTML, (val) => {
      let currentValue = val.dataset.date;
        let momentDate = moment(currentValue)

      val.classList.remove('selected', 'utmost', 'utmost-right', 'utmost-left')

      if(dateFromFormatted && currentValue === dateFromFormatted) {
        val.classList.add('selected', 'utmost')

        if(dateToFormatted) {
          val.classList.add('utmost-right')
        }
      } else if(dateToFormatted && currentValue === dateToFormatted) {
        val.classList.add('selected', 'utmost')

        if(dateFromFormatted) {
          val.classList.add('utmost-left')
        }
      } else if(this.dateFrom && this.dateTo && momentDate.isBetween(this.dateFrom, this.dateTo, 'days')) {
        val.classList.add('selected')
      }
    })

    this.dateFromInput.value = this.dateFrom ? this.dateFrom.locale(this.userLocale).format('DD MMM YYYY') : ''

    if(this.rangePicker) {
      this.dateToInput.value = this.dateTo && !this.hasError ? this.dateTo.locale(this.userLocale).format('DD MMM YYYY') : ''
    }
  }

  updateNumbeOfStudents(students) {
    this.students = students
  }

  updateAvailableDates(dates) {
    _.each(dates, (val) => {
      const dateElement = document.querySelector(`#travel-calendar-${this.calendarId} [data-date="${val.date}"]`)

      if(dateElement) {
        dateElement.classList.remove('available', 'not-available', 'no-info')

        if(val.isAvailable) {
          dateElement.classList.add('available')
        } else if(val.isAvailable === false) {
          dateElement.classList.add('not-available')
        } else {
          dateElement.classList.add('no-info')
        }
      }
    })
  }

  updatePricesData(data) {
    this.pricesData = data

    _.each(this.pricesData, (priceDataObject) => {
      const dateElement = document.querySelector(`#travel-calendar-${this.calendarId} [data-date="${priceDataObject.date}"]`)

      if(dateElement) {
        dateElement.classList.remove('available', 'not-available', 'no-info', 'dow-available')

        if(priceDataObject && priceDataObject.itemsLeft > 0) {
          dateElement.classList.add('available')

          if(priceDataObject && priceDataObject.allowedLength.length) {
            dateElement.classList.add('dow-available')
          }
        } else if(priceDataObject && priceDataObject.itemsLeft === 0) {
          dateElement.classList.add('not-available')
        } else if(!priceDataObject || priceDataObject && priceDataObject.itemsLeft === undefined) {
          dateElement.classList.add('no-info')
        }
      }
    })
  }
}

window.TravelCalendar = TravelCalendar;