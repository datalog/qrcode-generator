/**
	https://github.com/datalog/qrcode-svg
	under MIT license
	# qrcode.js has no dependencies
	Copyright (c) 2020-2026 Constantine
*/

/**
 	QR Code encoding is based on the implementation by
	@nayuki (https://github.com/nayuki/QR-Code-generator)
*/

'use strict';
var KANJI_LOOKUP; /* lazy cache shared by qr instances. */

function QRCode( Q ) {

	var
	 qrVersion ,errorCorrectionLevel ,qrMask ,qrSize
	,modules = [] ,isFunction = []
	,max = Math.max ,min = Math.min ,abs = Math.abs ,ceil = Math.ceil
	,NUMERIC_REGEX = /^[0-9]*$/ ,ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/
	,ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"
	,ALPHANUMERIC_LOOKUP = []
	,BASE64_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

	/* version      1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    error correction level */
       ,ECC_CODEWORDS_PER_BLOCK = [
		 [ -1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ] /* low */
		,[ -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28 ] /* medium */
		,[ -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ] /* quartile */
		,[ -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ] /* high */
        ]

        ,NUM_ERROR_CORRECTION_BLOCKS = [
		 [ -1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25 ] /* low */
		,[ -1,  1,  1,  1,  2,  2,  4,  4,  4,  5,  5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49 ] /* medium */
		,[ -1,  1,  1,  2,  2,  4,  4,  6,  6,  8,  8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68 ] /* quartile */
		,[ -1,  1,  1,  2,  4,  4,  4,  5,  6,  8,  8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81 ] /* high */
        ]

	,PACKED_QR_KANJI_TO_UNICODE =
		 'ADAABgYA/wwIADD7AP8aBgw/ADCbBgAAtOsF1AXXBc4CywIAMP0GxQEGuQK4e7N7BgbuA9FDDQD/D54FADAcj0AA/1wAICYFHQYKBgD/CAYAMBQGAP87CEAIAjAIAgoA/wsAIhIAALFQAQFEtwcAImAA/xwIACJmBpUBMKAQBwAAsIh+BqQDAP/l'
		+'xQPABga/BgcKDDCSBgAmBgV3DAURBU0FKgUaBYUWsj+DOgcGCIQ6AQuZOAr6AQYNBrUBBQEIBwYAAKwAIdIIXAoBCz6OAt4BowQOuAEhNAalAUpDNBcGAQeFBPkDghkHCZcZBtl9AQQAJe8BEgL/EAIKAQcUAwIZAQcSAwIZAQQCMEECUwEOIAMC'
		+'PgEBAwIXAQgCA5ECEQgDAgYBCBQDAhAIAwIGASmSAQMCBSsuAwIZAQ8DAgY8OQMCBwEBAwISAQ0AJQAIGAwUCxQkEyQUeQgcDBQLHCQTJCRZIhEiFEcqGSoYAeAFAE6c+BneEwCWPwBUwLoxngjnJACQIt0utQWbI89m8gyMKfMg9nmDB6JlAGiT'
		+'20X4OeMMrxuZBwCGe/ZJp268AaR3AGIWlmq0MABbidwMrBGgDuYGAJXHkAcAZ0/XYU6KAaQB3ALWGo4JvgJelAiwE2TGAcoS6AvuHq4SRpoS6A6IAawLmg2uEcIKqhVOAFM7zxIk+CQAgLKiQKdfAE4A5ivmVgCQOI9Y8CO9AsxmAFFB4gieBUyC'
		+'CLoMuBQAmPIAbev2S5YRAQPuRCBkugUAVAszrB6UVeA7jkDQHABTbwCdXAB6ugBOEQB4k9Ylr0+fYKsEtlj+Z8ZcAFnl+xj+ZvAdAJWPAFZC5R4AkEvSGslO/lYAU+GuB/gVhhHiGqoDpgTsEPoCcOgc3gmQDtB3iVXYFY4IniIAbbL2H8IEAJnF'
		+'AGCmAIsBlgrUIABpjsVX0QgBAZwWwASsBOQJiA3oBIYOmgGaI64J+AWQAo4B/AHYBYgr7hG6AZALliv6B4QrAFhpqjXAGpojAFH57hxyuhi8AcQLgA3kEP4DngKyH/AwriawTz/wBgBcoe4/zlsAUQSSLdoVAIHGo2XaJwBOWcYGgA7mM4Q30DDM'
		+'dgBOC5oU0xDSATPMAV/eDKIFuAiQDOgG7gNa5HeXTa4EOLAO0gX0DrINmhdmgAKaBdgcWFbqAfQBO6oOnA0AVikAjKiADdQBpBurQgBPxMw01hSUQcgL2DK0A4YRiBeOKKAJiAMATsuiAQCJ4wBW3twFhALmGOQDggHYAWfgBYgBgAPWCQEDAJtB'
		+'AGZmmAmSE/YLvBP4BOIb5BSsFag2igTlJwBR8Z4DtBnJEYQcygWoEbgg3hDAK4AxnA66CO4kphwAbWwAmaihSwBXo7xBonuELQBSg4wQiQqiK6AQtAeKDguKDvIelBXmBuI8dLYOtAbYB/AS5gOuAwBbZp4FmDMAmE0GAGObjl7tQwEBrAGVBwCc'
		+'DQBvX91z2gyqK/wJoimcA5gDmFbuEuwYAE4UAJw5AFP2zlTCBACXhABoKp9bAHrD4ifYNOQGAFZbAJ0oAGgiymvcBJseAFIIAILFwTcATn6OBL4I6CiTJ6ADIqwsxSGkCvwG0AYcigGyChLYCPwBjAG6Ab4IkgbiCYgC0gKMCS6MBJoL7gGnAdoV'
		+'1AGaB1TsD8gChAKUB54F+ALeApYH9ASuGLYEwge2D54PiAUHJooD4AWuBaNcAE446heeIqwEvlfKCuQDqWoAf+vENPAmpAWKAQwATwEeyhHaCJwDqAaeBYgH+gKcA/wF6AGgBcgQnA3JBRr+BNwGEQEDugbhMK42qAHQAYgklg/Nd756hAyJdQCJ'
		+'j5YCvAqKA64FpgGOJ9wE4AQAToD+B4oCqiKWCKoapgHcCaAZ0B3mC/AOyBmoIYYL7AIAY6wAg8qwTwBUCQ/UBtZKjAgAinCVSedCAJ7NAFN04CAAgRrwFPAmAE4YXogCmAH2EuAB8B3ODagE3BQBAdwHjhRk5gGuDpoO6hl0uAGoCDvUAYFe7DHD'
		+'epgiygbYEyB2kiz4YLIP3A66FABvAc4qAJtaAE6oCgbiAw7mBPABAHr2AFFxjgLABWnAAdwBhgeyC8ARsAkqzgNGPugK+AjoE/AJhhhaiBSWJB6KBJAN1i7YC8AQtAWKBABO8N4LpCmsKdwL3TToKooKrCj1LOZQAFDFwgjKEfIaAJMmAGWkghY4'
		+'8iOeFXygBoIK4hOqBOoSxAO4B7QShAgAVB8AkoAATl22B+IO2QK+foIDqhH+K5YvsiwIGABRd8o+AIZeAFWwAHp6AFB2vi0AkEeAGQBOMtZyAJHnAFxRFQEDpB2SXJs4AJd0qSDxUsMkAJaIj2jZUbZZwVgAk2wAUvLWBACFq9QR4SnWPKwIAFNm'
		+'AIiIkT0AT8L8A6oFnQOiELgH/nLBcZAHphhI5gOGBCGIAZYIlALoBIoEqgemF6odshOAC6YBngHoAsQEyg58ig76DLoBigSyDr4k7hWxa7A0uDABAQBSh7Q+zAn+LACWmQBoQeNeomq4BbgLxCy8C+QrygcAZwinYIoFKYIBsgT8AlqMDdQF8AOS'
		+'C+AQ9AqQAfoDggLYFp4ErCFiiALQE7oBmBTdGb4myCOgBpYH5AemBqgMjgy6B4AHzhEAUUO8CSyUK9oC7jvuAewT+AGOJewTlh/4A7AtAE5O/ga2D7QCgAqyC6oGngr4AvwBpgyeDNgJ0hr4Efgn2C+pIIQBogzACfYQxg2iEaQSxAbcGgBOlAf6'
		+'AfoQhgQZ5he+FS6ABJQg0gecJ9IQvkgQqgO2GABOXgCbyQBOpLQDatgBCeoESuoEOI4BvAKWAWABAwn6BZQHpgG6B7IHFmiwCQgkhgIaMj7GAfgE+AOaBYYBogOsBpIDhgHmAvYB7ALwAewErAqaA4IBkAPgAa4argXOB6oHxgpOKpABqgHMCSfc'
		+'AgjKAnq6AtQE+BMu+AqSBrgBoA/aAvwD52j+atQK1gIBAfQGrAaCBcoJAFJbpAGcBSaeE8go1jOYcu4LuD0AUUvkA6II6goAekDyXNYv6AUAc0T5ENJJwTGrVL4DAJqoAHLbxnMAa2QAmAMATsrQIOwBuAW8BqAYwgWUERXqCPQBkBXAH84d7BSs'
		+'YwBOm+4C9hH+BNYh8gEUnijAErgfog6gSZAl8SoAV1CyHYwS70kVxgPqVfFIrg6+Be4H9g7MC6wFvBLwDK4K7gkAkceRfa4WJpIFwU/IXtwazhOUGageAFJkjBPUQLhg8jQAUbSgFgCWKgBYOqRF2FwAVLK8IacUAHiVAJ36AE9c4AuGCeo+2Afc'
		+'A8YDokqoA5wHnlgAaFwAm60AezkAUxmhBt4CAQPUJrIc9AZ0kgmeEuJn1EQAdpAAm9YAY0wAkwbOIgB2v91BlWGiCtgM4iLyEdgOpgP8C5ImzAe2BewZ2guqIOATtAW+ErQeAGWsggTEE+9yBdABjgH6CoAHD+YH9AOkCMQDB3CmBf4D7gZW3AaQ'
		+'AdgL1AipJ6opIFruBo4PAQE2rALwHIwY9AHyDEYo8g3EAeYDyh6UAxoJUMgBtgcu5CfkCABrb8tz5gKmAYoHkijKAqAV9gaGDcIT2A6jCIoWggqyBN4L9gGoG1LyBtgKmCwAbFAAnn8AXw8Ai1iqRwB6+oBQAFuNAJbrAE4D4BeQEPgEtAa6A84T'
		+'8DeSAvQa3FwAW58AhQDDJABQcohe1moAXGEAhUrbHOQPAFGZ2inMHQCNZgBlnKgvpB+2D+ALtCzeDswG0SbKJwBQH7oLhCW2LNYk9gayfPwBygWPQQBbwuINlAf/SroW6B6KG9ATthHCHfIDoBn+HPQw4g6MIQBREo4LqgKuHpYe5hrqTaxlAFba'
		+'mwy4AgED4hy4At4G4zeqRP4H7CigMhryDZoEjga6CGjmCfAO3ATACMwL+gKIBLgERrgV1xQATsCiAvAH/AeoMfoJkBfeEZgHtBWKK9JO8AIAU9SOFdAKqEicLqYTqQYAWH7GZM1+AIhTvh4AT8rmNNgkkkbyDPYcyl8AUcbMN4gZig64CNgJAQHK'
		+'AqADuB6wGOl8AJB1qASCGgBR5nLKQKYRlAGGHcs9vHzEBvdh8nqUAYYUAFKp5AS4FrwUhgSOAwCS5IQOAFC31AGAB4oBUs4C/APAAS3QA6YNsAGAAvYFpgEWCBbYCRCwAaQCogwOsgHmAi2kCg5GlgGUBMwE/gUwkgqcA4YCogHMCy+GAcQR+AS8'
		+'BcwCzAGaAuQDZrAGqAK+DYQN7gKAA6wMsALcBD40QuAH/gGQE4gDtAS4AowK/AMATgoHMHaEDbYDwBXQAbQCsAmwDJ4K9hDKCRngF+gV/grkE64p+BqQGdQFAFYxigcAmP4BAwBi7cQYlgqyGdIxygj6B+wd9juXRrwhAFw7iTTWAluoFbYU/gYc'
		+'uA+aBsYHhgq6AsoK3gK+D/YBiB2QAtAFggmUAp4N5BKcA/oLhBCkAuYR5AOyAtoG2BQATroSiA3oGfIBwgyiZL1jAIFO/CL6FsAamASTcdg+9jTPGgBW85kNAQEAkBcAVDmWDcoaihacIrARshvYFK4NpCKoH6gE/AYU8g0AdF4AmsQAXQfIAZIg'
		+'6AgAjajqJABjbroPpAfcaqhRsQWHN/dllyyHIsc3AHAs5hTfPNlR6AHcAuYb4BbQAtYH4gxu2gKuAYAKuwOeDcgK3hHeCvwGyhe0DgBY8ACI/YgCxgQddKgV7gWEFxIAZYmOUvQb7lYAXi3iCoAFmg7iAfwFykG4CYQI5gecC8gu9AL+AYAC71YA'
		+'UgeoQ5wDvgLXBgCKLdc+/gTcO4Ax62WwEv4UAE7Z4gn6Bz6KIcIBLJIHlhFG1gnKDUauEvwBX4sVlh7oB2LnLuxS4ATeCAED5AHABagHxgJA3g2UE8QJ0gSKCgXwCDvoC9oYAFJN8gzsZoAIn38AeYWkE8ANzRMAVkyOCLIRiBysDQW+CYIm8AoF'
		+'hA6UAZYC9AqWAkyKI94QkjC3F4I7AFDnoAayBTC1D8YWjA3GAeBj51q2A5ElkDck1glSiwH8AQEBqAS8BKQEryTYL2S0FKQLAE6JAHXpogS6DpwJ5ANpjgvUCyKsBKQBggWYC9oSpgrcAdgMjg7wCwBQz5Qf8iMAgdPIDaoftAwAT8PmAqoH3AT8'
		+'M7gLsBCeG5J+3AkAT9eSMgCMygBlz5pfAFNSAIiWAFF2nknZISrCAoogjA0AkFwATtaMKSSQTcZ3AFU+sgukBpodygXgFexpw2MAlkCMDswBAE9T6iL0DwCAEABcsYAGsAW6AtoE1gOaE+YX4AfkR+YCrgXyFt4QlA1gvBmmIYMMAE7jnhTyFAB7'
		+'LMZZghveFgBu3ZgFq3PmB4YZqhuQAW6iJ54N6hDuV8YoAG/B/myPHwBR5wCG+ABT6gEDBckSAJBUywIAWWoAgTEAXf3ec65TAGjaAIw3gWUAnEgAaj0AirAATjnCFOAKxAXCLb4DjAnUFaoK+AGoCYQdiAz6AqYIiAqWAo4YmA+QIwBW48wH8hni'
		+'GdYD2A/uBIgmpFYAUCQAd+UAVzDaH5gFrhjQF6wm0BCsFZAKzBTeJOAl13fdGb4WtAHqJQEBnC3RWNYCzCIAWuHCcQBOLY4D0jKSEb4Lgg7uBvITimacCIwHqhzOBr4bAGoXohiMDP4+5AW0IQBOAY4NjgKED9gZxgg+oAGqAkZwlgGACcIEpg76'
		+'AaYhzAvUC4QI+CSOA4IBgBiWDT7WCuAB0hK+C5oKyhMAUsWoQr5OwT/qFY4d8GPaG44LAG0llVLoQYADAI/9vg6Bd4JpAFha1D6fEZIZ82rWf6sdAI+7rSrnHcRWAGk/5hiPYJ4G7ggAfSyHLMN4AJHjpi8ATq3GAqAENqAHAIyeAFRIvA/wDYoK'
		+'9AE0mAFU3gXWCI4CsALCE6YOkjGSBP4Brg/SEfoezAPADaIHAQPOAu4B2gLwNABs5Z0imAKqAoImpB6yEqBV1A0AbrqTZ5Ir2hMAj03EArIJAFF46huAA9wMiAnMPaxC6SXEXtAI9iUAcLkATx3IcugPghYAlvsAUU6IC84QSK4F7AroDI4YjgeO'
		+'G7ghzDWgJNIM1gOkCdNsLgBSqvwvkR6uCcAag0CUBagBAQFGaqQMjA0MggSACcYFrgLmDLYHtAaMDagD9gFK9DeBJLICqwOsC7YF7UmOWsIOqAcaB4wGugIAUjAAhGOQBPoB2BDwA4gFlgfsBxyYEL4J8gaKCLMRAFDNlAjyBPAPnBC2FvILhCKu'
		+'KugMohikDKIx6AgAXOAAnQcAUz+0MTzWN74T2BO8Cc4Ip0C4HIZfAGgDwAnVYQB6gZ1F1zMAnPaZaABbxQCRSQBwHs9m8he0EcIS0Bygf9IPqB8AVFHwSQCSDQBZSACQowBRhfMMvg4AhZnuFe9qvzMAk0sAaWIAmbTjbp0iAFNXllgAjt+MIABs'
		+'XaV35DasCwCP6QBTAgCM0ZMx5BcAXv/QG+dd6AsBA74g/goAl+4ATvuiKooZAIqN22qiJ58B+XUAhHGPRfcF/UyGBpAOwgTWNK4rAE5D9kLlQqYm9wSSKLg8mDXkD3CcAuo3uRjpCwBd9LASyggAiYcAZ3faFbwB9BuAEN93AH919AyCXABP86Q7'
		+'uBDuAo4HtAisPfERhDon4jnMCABQDdwftgrqNwEB4APmH7YG+GYAWPIAjOCYJqUZtyK5Nv0HiDEATy/wDO4D6j2IFPoT6iayFIYExhagDdIpAGbdiiHQC64wpBawWM4TAFH9AHuxgQ2QDaITgRXDQZEyAICM+SwiAFFrAJJiAG6M4B++bKolAE8Q'
		+'AH9wq3PqYrBpjB0AVnrCBwCG5LQ/AE805AvQBIoCINoo0BjOBeAHghMk+BfSAYAF0gXeI9oP/g6EG81DiFgAcWkAmBK+AwBjPdwMhjz4BdwH6jHaBgBTKlKuA74VjBTuA/AEsgZkaM4LjBn0A9Aj/APKB5IF6g/cBuAEkCCgCIgIjA/CG/4FAGoL'
		+'3kgAUJnOLuQNth+mEb4hrAuOIgED3n4AZ8qeSQBTOQB1iwCa7QBfZgCBnawJtQ0AXzyWAr5WzBfwUwBoZ/s55AIAfRCnGuBSAE/17j3iKsAImgvEF5AShDzeB8wIAF7f5BPwR54QjiSmQW+vOaYJhFUAVMHaKsQYpB/2CqhyXNQtAGVP0j4ATg2a'
		+'A5QkmgX6BNAFyyi6MbYC+AXECYYMAQFkkgOEHJQT5CPYGJgBggSKI4wFkAGgAtQiVABPrv5T+hr0WooJlgSALgBcAag1AJio31C+AwBPD8QN+DTLBZQjiErYH6AeggKlbr87gA3KKdV3AHJpAJuSAFIG7gj2CIIJ5iOYA9w6214AfImuAX6uZwBl'
		+'h7JrAE4ZvAWECJobyhgksgL4Ir9mAIU9nEGoA9NnoG4AUPuQH652pgkAUiUAd6XcNZkmAFBP+CKAZYQmxgioRzj2AQBPv5gMxB20EwCXrQBP3QCCF6pDAFcDqDGsIIgn5k70GKdTAFLf7BaII+4CzBLCFOhB2B4AUCNZngyGBdoPtASsCaoFBXje'
		+'BboQ8AKyB/oBqAUBA5gXHLQQ9hz2F+oKrge2BcQDsAikCLQExAi8EdwI2hjwD/YBAE5PqAHcB5YH7BPACa4SugYG0AnuEdIB7gKIBINdAH0hlg6ABLQlnAZqghfsDgBUIACYLABTF4cJkgqcFZgwiArqLIIUxAvEXgBSw8BnuQSPTpwZ8xO0N6Jj'
		+'AFHhAHbGAQG9SYJSAJtU0g0AV8vgB+Ax6gXsEM1b5FOLLgCBnJFoAJuqAGf+AJxSAGhd8Wb+BM4P5jvoEYQWAI/EAE+tAH5tAJ6/AE4Huk3ANNoC1FcAVHPySgCbRQBd88h21XvPAwCHHKdjklr9KuwbAFmZAHyN+0GiLABS2ZYZgmCABfwVnH34'
		+'GABpC5s60QHpIdQJ5AGmRqZDtGTGCrwpAFnq6mGzDvN1/F3wU17wZbQdAGR41hbGYwBZhLoH/EGEHbIPhBvOCYgSAFEy8FcAntkAdu6bPslRAJkFAFwkshiKaehAAFVP0i2uce5hAFMBxxKyDdAdwGT8N7RGAF8l/mIAU4TuL5p21CKSErgRliMA'
		+'Z/P6ds46AGEJBeYutiYBA7pSmhEAVS+/F7YHvgaMBLgftAvKCMgDrAnqDKYDnhq5A9gWBvgHwhCOPooH6BaSAcwBohfxPABZFZ0qpgOZBQCKifASpiMAUK2iN88TygiCDMgURJIDugjgCaAC6gzaBsALrA6SFroT8AGWEYQC9BLEBtYLugm0GJ4K'
		+'AGF+qgTGIgEBpgXmA7RJZPtIjkfuIIAFAGdlnHGaUo0FAG0bkEG8G940AE5xjBS6J+w20hPIV8QB+A0AUinQB7Ah1iu4BcAt/gHCBd5LKNojsBTXAQBfi/xPjB2KJgBjoI5HAFKJ9Gq6Bd4VpAWoDNIQ7GfXbgCfjQBPtvRGshEAhlwAToZU3Aj1'
		+'CtoOyCjaJtQL+hTKFcoM2gXiCZoLlBbKIdgWqgXQEsoGAFKbAH3RAFAr3g2CUOwYjhDKCe42iDX2HewWlAkAdGDBcLRVsD7ibABO5KgBrgHcCPgDlizICbBOmBayJsY9ihKCASyeHpoDAGamoBO9ZZwCznj4XwBeyYgGjgWqNtAI7ivwBvoJAQOC'
		+'Eu4slgwAVEIAm28AatPwFvZw3gSKJQBStJ4elhJ4qiDOCTSwD84Gqg24AuYjrBD+AZ4biiYAUW0AnpMAeYSSHNJKuyEAUC3CEQCKcZF8AIzE/S4AYNGiGwCd8gBOmQUAnBDNRtcStQHTcYAWtiiAIwEsAF8M+0MOLhIOEAoKLAhYCgCMawBOigCC'
		+'EgBfDYFCJAYGCCAKCjQFFQgLLhIiHzQopgFXWggPI2IoEhY9JxJGRzIkiAaLBRolGAoXFhcsBm4gKzANQ9UDuANaFApfIUgZfgz8Wt9aDRMoCzAcFDgtYgcBAzIGMSIsFBIUFxoaCywTBiwFBRASNgkOBQwGKA8UIAB6+ABRaQYMKAiwFZsVCRAI'
		+'CAgGIAgLEgYGFAcGBw4UFAwoDgCGVQBR6QwBAQoOFhASFg82CgwOEDAZEgYoFzAYGRgcByQSB0UyFgCPqAUAUqwGIhEcHBgSDgoAmO0AUuAqCAoGHggAdTgAUw0KBRAOFhwICA4UEAXfFOgUDPEFlAYaDtgWvRYLGiwYEAUWCBAeAHwSkmsAU9++'
		+'TOgrg3gPDh4SfAorBiIfFB0bZoYBNzZhKBARSDEOFyAcF4YBTTApEjQMQwEDCjI/OAc8HgZWDjEhBR4zsgESSjE/YDEmBkENWHw1pQO6Ay5LCjgQJGcSUEdGaC04OTQUI4QBPUIzBUBHrgEIom7ZbggLEAEBahFtfgc8DxgwGw0wFhQHIA8OCAkU'
		+'EAoIDDIaEgUODgUKCBAOB6EFrgUYJgYwKQ4iOLIBc1FAGBgeKiEQECoKIAcGcmseVCAMrgGlAYYBMU6kTd9NLXwcbDccIkxJCRcyIAcQCAUeFRQNJBoFCAYGDhQQGpo+hT4SBg4QEAB60gBZVQ0HHAcYBxIOCQEDIhY8gSmeAfQnIixIG6EBnAEG'
		+'mgEPHxopJlBcSSsGXBRkSAgeFQ1QGyIKKUwGJgUaPMcBuAEcFA4IDSYMDgYYDBIKCAqkKJ8oEAEBCkooGgwIGgssCAsLEhAOEAkoCAYOEB4IECQGFA4UDgkFvwP6AwibOKw4CioOCvULpAwkDRANIBEWKCQsCR3CAscCRhgIjgF9CxcKIBMFBWwQ'
		+'CwlGEgomCQdEDSIIIl1SDh4MEAUMDiQSCjAiBRMYOgYeBQkgFgkaCgg9YAYMAJ68AF5/RkYGEBQFAQMSHg8JBhIFEgYKDggJDAwQDhCsAQWlARAOKgwaFhIMCEFIDgYIFBwQDBwFCRoHFhcyDQUUFA4iOE4xLBErsAPrAkiCAQEBkQEVNjlKLw8w'
		+'DTFaRDVWHjMtCxIwQ0ZHWAUnVBy4AcsBMi8yDQYNLjuwAVVUHUGLA54DFiVK7gFzISMGFhsQFkBPFzwGdhUvBUoZCSMUFg4IYgxBBgYmFg0XHCcHF0hMCSFOMxAjEjgKQAcFYGENChsm4HbbdjYJKgwPGgcFCAgUBgwFFBIBAwoKFgwICAYgHiQO'
		+'Ew4ULBASGSwGCoABpQEmigEPLyxkdaAImwgsIwcTDltgigE/CnBNEDUQugEnIqIDnQOSARMfWm1eKw8wMJcBAQEHrgFaVRA+NxZMZ6gBQF8eKiTSA48EJjW0ARQSU7wDrQIHKAxFbEATHQgbPi9iF8h01XQG7QjyCBx+bwcHFBAJOgwxQgUUFgYI'
		+'BQiqQIlAIAUTGhAFLhAYBgCLigBlmwwcHBwKDQoUEBYHEgYkhgbTBRET9AX/BAYHM2oZDhM+BRIKBhUKICoOEA0NLA5MEyQZBwEDFBtADBDFAtICChIOCDQSFBQGAJc4AGcuJhUaFQUiNAgRGAZONXZdJ0gFOg07aHR5dHVwZVwPBQ4cbS4TRu4K'
		+'/wlUPTIeOTwBAc4BkwJgGCwURCNANRYHM9oI7QeNAYYBLTiuAYcCIYoCcYABY5gBDI0BWoEBEionxgFLH10ciAFbNSJ2CCMWB7kB6gIHOTwdMVgjbXpxPFVmCQVMMZQBC0glCCgtJM83yDcqRxQ7kgK9AiILEUJYGDg2O5oEpQQRGUCrAd4BZVJV'
		+'QhTiAr8CI2Zz0AF7iAFlOhUePyMv4AEJKjtABgEDG4Ruu20UBRcNEWgdIG1kJCYYpmy7bDQMAJsxAGsfNgXOLskuAJjuAGtHCxASFg0SDAgyBhAGDAUYGgkWEBAGDAoFCAwOGA4UHB4FFAsBAQCevgBsCBoGEhYFehUeFDQaHjU4PS8aQgdsXj8v'
		+'OCc0YQoeC0YsLyZu4GyxbBkoDUE8B0UPsgFkYRdCQ24SognBCewBPBmtAShCXyBQHyc8Lx1uRRohLgyCAYYBgwEttgEpRTmUAYMBmgFVX0wVLFe6A8cDOpgBVCdmJzwvHy4nSAaPATA+ScgCY/oEwwUcEIYBnQGCAYcBigHPAQED6AFZO6ICGwcW'
		+'BSUrtAKPAi4PS3AKZrsBngEjBwouHjtuFzIzDDYJKWAIJTIjICU+Bc8C1gINEiYgG0IocBE+iAGNARwNDWYrKAEBC2QbQgmcASNqRwsvGDBK3AHxASYqDFo/DiwVGg8oHA0gEgkQIAoaHg4FDAgWBgoGEA4ePBgMBRAaDBwOKBEmCgcYDCQHBjQH'
		+'AFAPAHMXHSgPEjINDws2JAYAntgAc1cqBxQUCRAFoAEtOikOThYjjAO9AtgBlwFdeBQ6L0QPMzoeEh0SHBQeKhZKDg7JAwED4gMKDAgODAcGEgUeBQgSCAUUBxoUECQUFgkFKC0sIg0KDAgaByQGKTAFESgQChQHQiEkHxQNDBk8CRQSGA1EBgEB'
		+'CQ4lGBMGNAgLMBQRBgYIJAsaHAYHMAsWBhAGBgkODAgMCAwMCg4KChQJEAYwDAwGBhQaFgscCgwICo496zweBQlODQ8SBhk8BiIqIAojGDgFDS4JECIHKBAKEAkGBxwQGAoIEhogJBCsBI8EmATNA5YBNygXQB8yKBkOSBkOFi8HFg5IAQMNHUoV'
		+'KhoFFCoFLkQVFA0NB1IOGioYAJ9LAHmqDA4QBiIcKA4ZCE4OGgYSBcEC5gIYChEcLB80BhIAn50AenAWDBoiBwoHKkIzAQEQIgUNjFf7VgoKCBAHEAYKDAYMEgooHg0LXjkGDjIdIDhY7wGWAYcBhgERZCMiHRYGDQhiDRInIgchEglnfGgXGgo5'
		+'KDIcVApfBfoBwwESHEMMRBcxXgwKGTQbKCIVJg0hJBQSDh8iEhYgHiwWGRYXEhoFBQkaDAoOCTAPGBC2eZt5CggIDBwBAws4ERl6ED0MHhcmXj0TTBcQQSxkF19sJ0BCGxkoKBcnqAK5Ah5eSzUmVA4SDz4VJUwONgchQicvCDJMRFkPDBgbAQEN'
		+'FF4XERQNBkIhBSoFFN8C1ALmROFEFgYKEAcKBggTHga8AggaEgYGCAYMBQwSBhQGByYYDAkOBQ4UGAUJFhwKEhkUCPYu2y4GDBoFHg4KGBDKY69jBxISEAYKDhIyCyILHBAIDgoQGgUHEAoMCA4IBTATEioAUZAAgKxiGBsMNTALajcIWCAPHDwB'
		+'A4RVjVUTLgetAe4BCRUGICIOCBcIQBkiBYsBbDASDhYPDgoIEyIMDBQFIygOBhIqBgoKBgoICgoKECoIHg0eNgUOCQ4OAQEHEAgGfYoBEAYQIg42GzwhbggLHUgFErYCowITBzlUV15jvAEFPzwFIhEyGS8LKwbeAS4kGQob6QHaAREKH3aHAQha'
		+'MUKcAUJTPWIQWWqXAXAkUSg6LgfJAfoBoAOZBOgBiQEowASvAx0biAGBASw1STeKARiLAa4C0wGyARBDeBsnQhchDiRthAJHGUoGLB0XBTOMAUoZIwEDEYYD8QIYWkw7FhFAeVISogHJAS5NEih2IS4vMg4UFBU+JhYTHQscPBMwIiAATlUAhlQa'
		+'FBhIJBAGQQZYES4ILza4BfMFVhgaCgEBHQssShsIEwoTMBMMKyZYGhMMLwwhkAEFNlsIUD0mEC0PJBK6AskBCT1ePB8KJJA82Tw2JSwFGWwKJ2IHIRMGMnuCAQ4FHgUkDgonLBYHJBIODBYwCURVFHSJASQuDTwtFi0yHCIfKAYkDAYMPBYPExsY'
		+'KBQHFmRNEg4GMAoVDQgsYYoBBwEDFAcWCQ4OChIODggWDhYUCRAKChQKCAY4CAYYHgwaKg8LIggUJho4FRsIbCEFF0oJCEwRIywGGxZGFhk0JhQbAQEJHkprCC41CWYNKnVuDxIWKvQxjTIOKi82GgoFDR4OBSYbHgoOFgocCAwGCgoGxAISBxYM'
		+'CAgOHhgcCBQSCw4KBhAzPABiHQCMrQkqGQYNFCgRSgUVSgkGFgYOCRQHCoBJ+UiPAZIBCKYBEAwIIDRWCwsuGgsXIiNCBhsMNhwGF0AGHyJKHQ0MMAEDCQgKDBMmGgtvdh9GCxgOEAcFEgUWBwoOJhUaDDAtHhIKCiQUNgUjKhwNJAkSDxYKCyE4'
		+'HhQHHAkLIAkJFBYOAQEQBgZ0CgwYCBRKGgkUDrQCqQImGwYyDBwrJhMZPCIFDIUBsgEGBgaLAXoZNAgQGBIS6BjvGCQNDAUYBRA2EggMXggAYkgAkNtSJBI2BzgcCBoIDBgFNgcRRBYMDRoFEBAGFAgOEBYID0YRBlRBLjQxC54BEScMOjueAa8B'
		+'HA6cAQ8JFIUB7gEvB2hQLZgBLwEDLRYTFjINEEYMPB8zuAELBjVOPgYmCR0tOB0TPHAPBSMMFlAZGCs2EiYfMg4ICxyFCZIJDggQSUgICgeKBA4KGAgIBgEBEhQFECIFBw4cAG/2AJXDGAUWBQgQDgwJggESEAYqGAoLXDkIBQgSHA9GGgkIKgkY'
		+'BgcMCAgGLgkHDIM2ojZmc0waCAgaDQoHEgoaEBAWDAYQCAgPEioMDAgIAFLSAJdrEBQcFQ4RHA4MBhwcBwkkBiIKCAomJsgdvR2pdLJ0BTgJXCsJMBAWFgtEDAYBAwYKBXIOCA4gBQpKCDQQFggMFgsGEAscCCIGDBILGg0QBg8WiAEGHhQGIEoL'
		+'CA0RPAYKBhYJFiAXSXIoHCAJBwoBAQ0yEyALFAoKBQ4IBYoBChwMIggIBhgGCgYKFgsKEAkQDBooCA4KBggIBgYGDAYKKAUcBwYKEjxCIyAOBhQGFBwcGCUeFggGJgUIIx62AZMBBQVOBRkYEQ8IGBMPWCkYBQkiMi0sEzwQEiII4gEODDYFPTQK'
		+'TAuWApsCC05hCWIHBRQIAQMuBhApBRY2MgdMexpEGA4WKAkPCQgcFh0yD04nEgggPgYKsgEMDAwSCgYQCgscFAwiHwqbHdodCAYGDBQIBQoOChIBAQ4IBggIBgYYBgB2twCfFRwaKBwUCCILBgYOBg4HHg0MQhIMAFgvtEYAkFntbwBR3P5+AdsB'

	,MODES = { /* mbits: mode indicator; cbits: character count widths. */
		 BYT: { mbits: 4 ,cbits: [  8, 16, 16 ] }
		,ALN: { mbits: 2 ,cbits: [  9, 11, 13 ] }
		,NUM: { mbits: 1 ,cbits: [ 10, 12, 14 ] }
		,KNJ: { mbits: 8 ,cbits: [  8, 10, 12 ] }
	}

	,eccLevels = { L: [ 0, 1 ], M: [ 1, 0 ], Q: [ 2, 3 ], H: [ 3, 2 ] }


	,decodeBase64 = function( text ) { /* base64 to bytes; atob() decodes, btoa() encodes binary strings. */

		var
		 lookup = []
		,length = text.length
		,padding = '=' === text.charAt( length - 2 ) ? 2 : '=' === text.charAt( length - 1 ) ? 1 : 0
		,bytes = []
		,bits = 0 ,buffer = 0 ,written = 0 ,i = 64;
		while( i-- ) lookup[ BASE64_CHARSET.charCodeAt( i ) ] = i;
		for( i = 0; i < length - padding; i++ ) {
			buffer = buffer << 6 | lookup[ text.charCodeAt( i ) ];
			bits += 6;
			if( bits >= 8 ) {
				bits -= 8;
				bytes[ written++ ] = buffer >>> bits & 255;
				buffer &= ( 1 << bits ) - 1;
			}
		}
		return bytes;
	}

	,decodeKanjiTable = function( text ) { /* trusted embedded table; validated by tests. */

		var
		 bytes = decodeBase64( text )
		,table = []
		,offset = 0 ,index = 0 ,previous = - 1
		,token ,value ,step ,count ,encoded;

		function readInteger() { /* unsigned varint. */
			var result = 0 ,shift = 0 ,byte;
			do {
				byte = bytes[ offset++ ];
				result |= ( byte & 127 ) << shift;
				shift += 7;
			} while( byte & 128 );
			return result;
		}

		function readValue() { /* big-endian unicode value. */
			return bytes[ offset++ ] << 8 | bytes[ offset++ ];
		}

		while( offset < bytes.length ) {
			token = readInteger();
			if( 1 === token ) {
				count = readInteger();
				index += count;
				continue;
			}

			step = 0;
			count = 1;
			if( token >= 4 ) {
				encoded = token - 4;
				value = previous + ( ( encoded >>> 1 ) ^ - ( encoded & 1 ) ) & 65535;
			} else if( 0 === token ) value = readValue();
			else {
				value   = 2 === token ? readValue() : previous;
				encoded = readInteger();
				step    = ( encoded >>> 1 ) ^ - ( encoded & 1 );
				count   = readInteger();
				value   = 3 === token ? value + step & 65535 : value;
			}

			while( count-- ) {
				table[ value ] = index++;
				previous = value;
				value = value + step & 65535;
			}
		}

		if( 8192 !== index ) throw new Error( 'Incomplete kanji table' );
		return table;
	}

	,getKanjiTable = function() { /* one decoded table for all qr instances. */
		if( undefined === KANJI_LOOKUP )
			KANJI_LOOKUP = decodeKanjiTable( PACKED_QR_KANJI_TO_UNICODE );
		return KANJI_LOOKUP;
	}

	,reedSolomonMultiply = function( x, y ) { /* gf(256) multiply, modulus 0x11d. */
		var z = 0, i = 8;
		while( i-- ) z = z << 1 ^ 285 * ( z >>> 7 ) ^ ( y >>> i & 1 ) * x;
		return z;
	}

	,reedSolomonComputeRemainder = function( data, divisor ) { /* reed-solomon remainder. */
		var result = [] ,i = data.length ,j ,factor;
		while( i ) {
			factor = data[ data.length - i-- ] ^ result.shift();
			j = divisor.length;
			while( j-- ) result[ j ] ^= reedSolomonMultiply( divisor[ j ], factor );
		}
		return result;
	}

	,applyMask = function( mask ) { /* mask data modules only. */
		var
		patterns = [
			 function() { return 0 == ( row + col ) % 2; }
			,function() { return 0 == row % 2; }
			,function() { return 0 == col % 3; }
			,function() { return 0 == ( row + col ) % 3; }
			,function() { return 0 == ( ( row / 2 | 0 ) + ( col / 3 | 0 ) ) % 2; }
			,function() { return 0 == row * col % 2 + row * col % 3; }
			,function() { return 0 == ( row * col % 2 + row * col % 3 ) % 2; }
			,function() { return 0 == ( ( row + col ) % 2 + row * col % 3 ) % 2; }
		]
		,pattern = patterns[ mask ]
		,col
		,row = qrSize;

		while( row-- ) {
			col = qrSize;
			while( col-- )
				if( !isFunction[ row ][ col ] ) modules[ row ][ col ] ^= pattern();
		}
	}

	,getPenaltyScore = function() { /* mask penalty: runs, 2x2 blocks, patterns, balance. */
		function addRun( length, history ) {
			if( !history[ 6 ] ) length += qrSize;
			history.shift();
			history.push( length );
		}
		function countPatterns( history ) {
			var run = history[ 5 ] ,pattern = run > 0 && history[ 4 ] == run && history[ 3 ] == 3 * run &&
				history[ 2 ] == run && history[ 1 ] == run;
			return ( pattern && history[ 6 ] >= 4 * run && history[ 0 ] >= run ? 1 : 0 ) +
				( pattern && history[ 0 ] >= 4 * run && history[ 6 ] >= run ? 1 : 0 );
		}
		function finishRun( color, length, history ) {
			if( color ) {
				addRun( length, history );
				length = 0;
			}
			addRun( length + qrSize, history );
			return countPatterns( history );
		}

		var penalty = 0 ,area = qrSize * qrSize ,darkCount = 0 ,row = qrSize ,col;
		var rowHistory ,colHistory ,rowColor ,colColor ,rowRun ,colRun ,module;
		while( row-- ) {
			rowHistory = [ 0, 0, 0, 0, 0, 0, 0 ];
			colHistory = [ 0, 0, 0, 0, 0, 0, 0 ];
			rowColor = false;
			colColor = false;
			rowRun = 0;
			colRun = 0;
			col = qrSize;
			while( col-- ) {
				if( modules[ row ][ col ] == rowColor ) {
					if( 5 == ++rowRun ) penalty += 3;
					else if( rowRun > 5 ) penalty++;
				} else {
					addRun( rowRun, rowHistory );
					penalty += 40 * countPatterns( rowHistory );
					rowRun = 1;
					rowColor = modules[ row ][ col ];
				}
				if( modules[ col ][ row ] == colColor ) {
					if( 5 == ++colRun ) penalty += 3;
					else if( colRun > 5 ) penalty++;
				} else {
					addRun( colRun, colHistory );
					penalty += 40 * countPatterns( colHistory );
					colRun = 1;
					colColor = modules[ col ][ row ];
				}
				module = modules[ row ][ col ];
				if( module ) darkCount++;
				if( col && row && module == modules[ row ][ col - 1 ] &&
					module == modules[ row - 1 ][ col ] && module == modules[ row - 1 ][ col - 1 ] ) penalty += 3;
			}
			penalty += 40 * finishRun( rowColor, rowRun, rowHistory ) +
				40 * finishRun( colColor, colRun, colHistory );
		}
		return penalty += 10 * ( ceil( abs( 20 * darkCount - 10 * area ) / area ) - 1 );
	}

	,appendBits = function( value, length, bits ) { /* most significant bit first. */
		while( length-- ) bits.push( value >>> length & 1 );
	}

	,numCharCountBits = function( segment, version ) { /* character count field width. */
		return segment.cbits[ ( version + 7 ) / 17 | 0 ];
	}

	,getBit = function( value, index ) {
		return 0 != ( value >>> index & 1 );
	}

	,getTotalBits = function( segments, version ) { /* segment headers and payload bits. */
		var total = 0 ,i = segments.length ,segment ,countBits;
		while( i-- ) {
			segment = segments[ i ];
			countBits = numCharCountBits( segment, version );
			if( segment.numChars >= ( 1 << countBits ) ) return Infinity;
			total += 4 + countBits + segment.bitData.length;
		}
		return total;
	}

	,getNumRawDataModules = function( version ) { /* data modules, including remainder bits. */
		if( version < 1 || version > 40 ) throw "Version number out of range";
		var result = ( 16 * version + 128 ) * version + 64;
		if( version >= 2 ) {

			var alignPatCount = ( version / 7 | 0 ) + 2;
			result -= ( 25 * alignPatCount - 10 ) * alignPatCount - 55;
			if( version >= 7 ) result -= 36;
		}
		return result;
	}

	,drawAlignmentPattern = function( x, y ) { /* 5x5 alignment pattern. */
		for( var dy = 2; dy >= - 2; dy-- )
			for( var dx = 2; dx >= - 2; dx-- )
				setFunctionModule( x + dx, y + dy, 1 != max( abs( dx ), abs( dy ) ) );
	}

	,drawFinderPattern = function( x, y ) { /* finder pattern and separator. */
		var dist ,px ,py;
		for( var dy = 4; dy >= - 4; dy-- )
			for( var dx = 4; dx >= - 4; dx-- ) {
				dist = max( abs( dx ), abs( dy ) );
				px = x + dx;
				py = y + dy;
				if( px >= 0 && px < qrSize && py >= 0 && py < qrSize )
					setFunctionModule( px, py, 2 != dist && 4 != dist );
			}
	}

	,drawFormatBits = function( mask ) { /* bch format bits, both copies. */
		var data = errorCorrectionLevel[ 1 ] << 3 | mask ,bits = data ,bit = 10;
		while( bit-- ) bits = bits << 1 ^ 1335 * ( bits >>> 9 );
		bits = 21522 ^ ( data << 10 | bits ); /* format mask 0x5412. */
		if( 0 != bits >>> 15 ) throw "Assertion error";
		bit = 6;
		while( bit-- ) setFunctionModule( 8, bit, getBit( bits, bit ) );
		setFunctionModule( 8, 7, getBit( bits, 6 ) );
		setFunctionModule( 8, 8, getBit( bits, 7 ) );
		setFunctionModule( 7, 8, getBit( bits, 8 ) );
		for( bit = 9; bit < 15; bit++ ) setFunctionModule( 14 - bit, 8, getBit( bits, bit ) );
		bit = 8;
		while( bit-- ) setFunctionModule( qrSize - 1 - bit, 8, getBit( bits, bit ) );
		for( bit = 8; bit < 15; bit++ ) setFunctionModule( 8, qrSize - 15 + bit, getBit( bits, bit ) );
		setFunctionModule( 8, qrSize - 8, !0 );
	}

	,drawFunctionPatterns = function() { /* reserved patterns and version bits. */
		var index = qrSize ,numAlign ,step ,alignPatPos = [] ,x ,y ,bits ,bit;
		while( index-- ) {
			setFunctionModule( 6, index, 0 == index % 2 );
			setFunctionModule( index, 6, 0 == index % 2 );
		}
		if( qrVersion > 1 ) {
			numAlign = 2 + ( qrVersion / 7 | 0 );
			step = ( ( qrVersion * 8 + numAlign * 3 + 5 ) / ( numAlign * 4 - 4 ) | 0 ) * 2;
			alignPatPos[ 0 ] = 6;
			index = numAlign;

			while( --index ) alignPatPos[ index ] = qrSize - 7 - ( numAlign - 1 - index ) * step; /* rightmost center: size - 7. */
		}
		var alignPatCount = alignPatPos.length;
		y = alignPatCount;
		while( y-- ) {
			x = alignPatCount;
			while( x-- )
				if( !( 0 == x && 0 == y ) && !( 0 == x && y == alignPatCount - 1 ) && !( x == alignPatCount - 1 && 0 == y ) )
					drawAlignmentPattern( alignPatPos[ x ], alignPatPos[ y ] );
		}
		drawFinderPattern( 3, 3 );
		drawFinderPattern( qrSize - 4, 3 );
		drawFinderPattern( 3, qrSize - 4 );
		drawFormatBits( 0 );
		if( qrVersion >= 7 ) {
			bits = qrVersion;
			bit = 12;
			while( bit-- ) bits = bits << 1 ^ 7973 * ( bits >>> 11 );
			bits = qrVersion << 12 | bits;
			if( 0 != bits >>> 18 ) throw "Assertion error";
			bit = 18;
			while( bit-- ) {
				x = qrSize - 11 + bit % 3;
				y = bit / 3 | 0;
				setFunctionModule( x, y, getBit( bits, bit ) );
				setFunctionModule( y, x, getBit( bits, bit ) );
			}
		}
	}

	,addEccAndInterleave = function( data ) { /* append ecc and interleave blocks. */
		if( data.length != getNumDataCodewords( qrVersion, errorCorrectionLevel ) ) throw "Invalid argument";

		var
		 numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ errorCorrectionLevel[ 0 ] ][ qrVersion ]
		,blockEccLen = ECC_CODEWORDS_PER_BLOCK[ errorCorrectionLevel[ 0 ] ][ qrVersion ]
		,rawCodewords = getNumRawDataModules( qrVersion ) / 8 | 0
		,numShortBlocks = numBlocks - rawCodewords % numBlocks
		,shortBlockLen = rawCodewords / numBlocks | 0
		,blocks = [] ,rsDiv ,dataOffset = 0
		,dataBlock ,ecc ,result = [];

		rsDiv = ( function( degree ) { /* reed-solomon generator polynomial. */
			var rootPower = 1 ,polynomial = [] ,i = degree;
			polynomial[ degree - 1 ] = 1;
			while( i-- ) {
				for( var j = 0; j < degree; j++ )
					polynomial[ j ] = reedSolomonMultiply( polynomial[ j ], rootPower ) ^ polynomial[ j + 1 ];
				rootPower = reedSolomonMultiply( rootPower, 2 );
			}
			return polynomial;
		} )( blockEccLen );

		for( var blockIndex = 0; blockIndex < numBlocks; blockIndex++ ) {
			dataBlock = data.slice( dataOffset, dataOffset + shortBlockLen - blockEccLen + ( blockIndex < numShortBlocks ? 0 : 1 ) );
			dataOffset += dataBlock.length;
			ecc = reedSolomonComputeRemainder( dataBlock, rsDiv );
			if( blockIndex < numShortBlocks ) dataBlock.push( 0 );
			blocks.push( dataBlock.concat( ecc ) );
		}

		for( var i = 0; i < blocks[ 0 ].length; i++ )
			for( var j = 0; j < blocks.length; j++ )
				if( i != shortBlockLen - blockEccLen || j >= numShortBlocks ) result.push( blocks[ j ][ i ] );
		return result;
	}

	,toUtf8ByteArray = function( text ) { /* utf-8 bytes. */
		text = encodeURI( text );
		for( var bytes = [] ,i = 0; i < text.length; i++ ) {
			if( "%" != text.charAt( i ) ) bytes.push( text.charCodeAt( i ) );
			else {
				bytes.push( parseInt( text.substr( i + 1, 2 ), 16 ) );
				i += 2;
			}
		}
		return bytes;
	}

	,getNumDataCodewords = function( version, ecc ) { /* payload capacity in bytes. */
		return ( getNumRawDataModules( version ) / 8 | 0 )
			- ECC_CODEWORDS_PER_BLOCK[ ecc[ 0 ] ][ version ] * NUM_ERROR_CORRECTION_BLOCKS[ ecc[ 0 ] ][ version ];
	}

	,setFunctionModule = function( x, y, value ) { /* write and reserve a module. */
		modules[ y ][ x ] = !!value;
		isFunction[ y ][ x ] = !0;
	}

	,makeBytes = function( bytes ) { /* byte segment. */
		for( var bits = [] ,i = 0; i < bytes.length; i++ ) appendBits( bytes[ i ], 8, bits );
		return { mbits: MODES.BYT.mbits, cbits: MODES.BYT.cbits, numChars: bytes.length, bitData: bits };
	}

	,makeNumeric = function( text ) { /* numeric segment. */
		if( !NUMERIC_REGEX.test( text ) ) throw "String contains non-numeric characters";
		var bits = [] ,i = 0 ,count;
		while( i < text.length ) {
			count = min( text.length - i, 3 );
			appendBits( parseInt( text.substr( i, count ), 10 ), 3 * count + 1, bits );
			i += count;
		}
		return { mbits: MODES.NUM.mbits, cbits: MODES.NUM.cbits, numChars: text.length, bitData: bits };
	}

	,getAlphanumericValue = function( text, index ) {
		return ALPHANUMERIC_LOOKUP[ text.charCodeAt( index ) ] - 1;
	}

	,makeAlphanumeric = function( text ) { /* alphanumeric segment. */
		if( !ALPHANUMERIC_REGEX.test( text ) ) throw "String contains unencodable characters in alphanumeric mode";
		for( var bits = [] ,i = 0 ,value; i + 2 <= text.length; i += 2 ) {
			value = 45 * getAlphanumericValue( text, i ) + getAlphanumericValue( text, i + 1 );
			appendBits( value, 11, bits );
		}
		if( i < text.length ) appendBits( getAlphanumericValue( text, i ), 6, bits );
		return { mbits: MODES.ALN.mbits, cbits: MODES.ALN.cbits, numChars: text.length, bitData: bits };
	}

	,toCodePoints = function( text ) { /* preserve java's utf-16 validation, including its char cast. */
		if( 'string' !== typeof text ) throw new TypeError( 'Expected text string' );
		var result = [] ,c ,low ,unit;
		for( var i = 0; i < text.length; i++ ) {
			c = text.charCodeAt( i );
			if( c >= 0xD800 && c <= 0xDBFF && i + 1 < text.length ) {
				low = text.charCodeAt( i + 1 );
				if( low >= 0xDC00 && low <= 0xDFFF ) {
					c = 0x10000 + ( c - 0xD800 ) * 1024 + low - 0xDC00;
					i++;
				}
			}
			unit = c & 65535;
			if( unit >= 0xD800 && unit <= 0xDFFF ) throw new RangeError( 'Invalid UTF-16 string' );
			result.push( c );
		}
		return result;
	}

	,fromCodePoints = function( points, start, end ) {
		var result = '' ,c;
		for( var i = start; i < end; i++ ) {
			c = points[ i ];
			if( c < 65536 ) result += String.fromCharCode( c );
			else {
				c -= 65536;
				result += String.fromCharCode( 0xD800 + ( c >>> 10 ), 0xDC00 + ( c & 1023 ) );
			}
		}
		return result;
	}

	,countUtf8Bytes = function( c ) {
		if( c < 0 || c >= 0x110000 ) throw new RangeError( 'Invalid code point' );
		return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
	}

	,isKanji = function( c, table ) {
		return undefined !== table[ c ];
	}

	,isEncodableAsKanji = function( text ) {
		if( 'string' !== typeof text ) throw new TypeError( 'Expected text string' );
		var table = getKanjiTable() ,i = text.length;
		while( i-- ) if( !isKanji( text.charCodeAt( i ), table ) ) return !1;
		return !0;
	}

	,makeKanji = function( text, table ) { /* one 13-bit qr value per utf-16 code unit. */
		if( 'string' !== typeof text ) throw new TypeError( 'Expected text string' );
		var bits = [] ,value;
		for( var i = 0; i < text.length; i++ ) {
			value = table[ text.charCodeAt( i ) ];
			if( undefined === value ) throw new RangeError( 'String contains non-kanji-mode characters' );
			appendBits( value, 13, bits );
		}
		return { mbits: MODES.KNJ.mbits, cbits: MODES.KNJ.cbits, numChars: text.length, bitData: bits };
	}

	,SEGMENT_ENCODERS = {
		 BYT: function( text ) { return makeBytes( toUtf8ByteArray( text ) ); }
		,ALN: makeAlphanumeric
		,NUM: makeNumeric
		,KNJ: makeKanji
	}

	,computeCharacterModes = function( points, version, table ) { /* costs in sixths of a bit. */
		if( !points.length ) throw new RangeError( 'Empty code point array' );
		if( points.length > 7089 ) throw new RangeError( 'String too long' );
		var modes = [ 'BYT', 'ALN', 'NUM', 'KNJ' ];
		var heads = [] ,history = [] ,previous ,current ,c ,cost ,mode = null ,minimum = 0 ,result = [];
		for( var i = 0; i < modes.length; i++ ) heads[ i ] = ( 4 + numCharCountBits( MODES[ modes[ i ] ], version ) ) * 6;
		previous = heads.slice();
		for( i = 0; i < points.length; i++ ) {
			c = points[ i ];
			current = [ 0, 0, 0, 0 ];
			history[ i ] = [ null, null, null, null ];
			current[ 0 ] = previous[ 0 ] + countUtf8Bytes( c ) * 48;
			history[ i ][ 0 ] = modes[ 0 ];
			if( ALPHANUMERIC_LOOKUP[ c ] ) {
				current[ 1 ] = previous[ 1 ] + 33;
				history[ i ][ 1 ] = modes[ 1 ];
			}
			if( c >= 48 && c <= 57 ) {
				current[ 2 ] = previous[ 2 ] + 20;
				history[ i ][ 2 ] = modes[ 2 ];
			}
			if( isKanji( c, table ) ) {
				current[ 3 ] = previous[ 3 ] + 78;
				history[ i ][ 3 ] = modes[ 3 ];
			}
			for( var j = 0; j < modes.length; j++ ) {
				for( var k = 0; k < modes.length; k++ ) {
					cost = ( ( current[ k ] + 5 ) / 6 | 0 ) * 6 + heads[ j ];
					if( null !== history[ i ][ k ] && ( null === history[ i ][ j ] || cost < current[ j ] ) ) {
						current[ j ] = cost;
						history[ i ][ j ] = modes[ k ];
					}
				}
			}
			previous = current;
		}
		for( i = 0; i < modes.length; i++ ) {
			if( null === mode || previous[ i ] < minimum ) {
				minimum = previous[ i ];
				mode = modes[ i ];
			}
		}
		i = points.length;
		while( i-- ) {
			for( j = 0; j < modes.length; j++ ) {
				if( modes[ j ] === mode ) {
					mode = history[ i ][ j ];
					result[ i ] = mode;
					break;
				}
			}
		}
		return result;
	}

	,splitIntoSegments = function( points, modes, table ) {
		var result = [] ,mode = modes[ 0 ] ,start = 0 ,text;
		for( var i = 1; ; i++ ) {
			if( i < points.length && modes[ i ] === mode ) continue;
			text = fromCodePoints( points, start, i );
			if( !SEGMENT_ENCODERS[ mode ] ) throw new Error( 'Unknown segment mode' );
			result.push( SEGMENT_ENCODERS[ mode ]( text, table ) );
			if( i >= points.length ) return result;
			mode = modes[ i ];
			start = i;
		}
	}

	,makeSegmentsOptimally = function( text, ecc, minVersion, maxVersion ) {
		if( !ecc || !( minVersion >= 1 && minVersion <= maxVersion && maxVersion <= 40 ) )
			throw new RangeError( 'Invalid value' );
		var points = toCodePoints( text ) ,table = getKanjiTable() ,segments ,bits ,modes;
		for( var version = minVersion; ; version++ ) {
			if( version === minVersion || 10 === version || 27 === version ) {
				if( !points.length ) segments = [];
				else {
					modes = computeCharacterModes( points, version, table );
					segments = splitIntoSegments( points, modes, table );
				}
			}
			bits = getTotalBits( segments, version );
			if( bits <= getNumDataCodewords( version, ecc ) * 8 ) return segments;
			if( version >= maxVersion ) throw new RangeError( 'Data too long' );
		}
	}

	,encodeText = function( text, ecc, boostEcl, mask ) { /* optimize modes and encode all segments. */
		return encodeSegments( makeSegmentsOptimally( text, ecc, 1, 40 ), ecc, boostEcl, mask );
	}

	,encodeMatrix = function( version, ecc, data, mask ) { /* build matrix and select mask. */
		var
		 row ,col ,direction = 1 ,bitIndex = 0
		,codewords ,currentMask ,score ,bestScore = 1e9;
		qrVersion = version;
		errorCorrectionLevel = ecc;
		qrMask = mask;
		qrSize = 4 * version + 17;
		row = qrSize;
		while( row-- ) {
			modules[ row ] = [];
			isFunction[ row ] = [];
		}
		drawFunctionPatterns();
		codewords = addEccAndInterleave( data );

		for( col = qrSize - 1; col > 0; col -= 2 ) {
			if( 6 == col ) col--;
			direction = - direction;
			row = direction < 0 ? qrSize - 1 : 0;
			for( var i = 0; i < qrSize; i++, row += direction ) {
				for( var moduleCol = col; moduleCol > col - 2; moduleCol-- ) {
					if( !isFunction[ row ][ moduleCol ] ) {
						modules[ row ][ moduleCol ] = getBit( codewords[ bitIndex >>> 3 ], 7 - ( bitIndex & 7 ) );
						bitIndex++;
					}
				}
			}
		}

		if( qrMask < 0 ) {
			currentMask = 8;
			while( currentMask-- ) {
				applyMask( currentMask );
				drawFormatBits( currentMask );
				score = getPenaltyScore();
				if( score < bestScore ) {
					bestScore = score;
					qrMask = currentMask;
				}
				applyMask( currentMask );
			}
		}
		applyMask( qrMask );
		drawFormatBits( qrMask );
		isFunction = [];
	}

	,encodeSegments = function( segments, ecc, boostEcl, mask, minVersion, maxVersion ) { /* select version, pad payload and encode. */
		if( undefined === minVersion ) minVersion = 1;
		if( undefined === maxVersion ) maxVersion = 40;
		if( undefined === mask ) mask = - 1;
		if( undefined === boostEcl ) boostEcl = true;
		if( !( minVersion >= 1 && minVersion <= maxVersion && maxVersion <= 40 ) || mask < - 1 || mask > 7 ) throw "Invalid value";

		var bits = [] ,bytes = [] ,padByte = 236 ,version = minVersion ,totalBits ,capacity;
		var i ,segment ,segmentBits ,levels;
		while( !0 ) {
			totalBits = getTotalBits( segments, version );
			if( totalBits <= 8 * getNumDataCodewords( version, ecc ) ) break;
			if( version >= maxVersion ) throw "Data too long";
			version++;
		}

		if( boostEcl ) {
			levels = [ eccLevels.H, eccLevels.Q, eccLevels.M ];
			i = levels.length;
			while( i-- )
				if( totalBits <= 8 * getNumDataCodewords( version, levels[ i ] ) ) ecc = levels[ i ];
		}

		for( i = 0; i < segments.length; i++ ) {
			segment = segments[ i ];
			appendBits( segment.mbits, 4, bits );
			appendBits( segment.numChars, numCharCountBits( segment, version ), bits );
			segmentBits = segment.bitData;
			for( var j = 0; j < segmentBits.length; j++ ) bits.push( segmentBits[ j ] );
		}
		if( bits.length != totalBits ) throw "Assertion error";
		capacity = 8 * getNumDataCodewords( version, ecc );
		if( bits.length > capacity ) throw "Assertion error";
		appendBits( 0, min( 4, capacity - bits.length ), bits );
		appendBits( 0, ( 8 - bits.length % 8 ) % 8, bits );
		if( 0 != bits.length % 8 ) throw "Assertion error";
		while( bits.length < capacity ) {
			appendBits( padByte, 8, bits );
			padByte ^= 253;
		}

		i = bits.length;
		while( i-- ) bytes[ i >>> 3 ] |= bits[ i ] << 7 - ( 7 & i );
		return encodeMatrix( version, ecc, bytes, mask );
	};

	var i = ALPHANUMERIC_CHARSET.length;
	while( i-- ) ALPHANUMERIC_LOOKUP[ ALPHANUMERIC_CHARSET.charCodeAt( i ) ] = i + 1;

	return ( function() { /* svg generator */

		function ishex( c ) {

			return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test( c );
		}

		function svg( n, a ) {

			n = document.createElementNS( ns, n );

			for( var o in a || { } ) {

				n.setAttribute( o, a[ o ] );
			}

			return n;
		}

		var
		 r ,x ,y ,d
		,ns = 'http://www.w3.org/2000/svg'
		,path = ''
		,q = ( 'string' == typeof Q ) ? { msg: Q } : Q || { }
		,p = q.pal || [ '#000' ]
		,dm = abs( q.dim ) || 256
		,pd = abs( q.pad )
		,mx
		,fg = p[ 0 ]
		,bg = p[ 1 ]
		,optimized = q.vrb ? 0 : 1
		,s
		;

		pd = pd > -1 ? pd : 4;
		mx = [ 1, 0, 0, 1, pd, pd ];
		fg = ishex( fg ) ? fg : '#000';
		bg = ishex( bg ) ? bg : 0;

		encodeText( q.msg || '', eccLevels[ q.ecl ] || eccLevels.M, q.ecb == 0 ? 0 : 1, q.mtx );

		s = qrSize + 2 * pd;
		y = qrSize;



		while( y-- ) { /* render optimized or verbose svg */

			d = 0, x = qrSize;
			while( x-- ) {
				if( modules[ y ][ x ] ) {
					if( optimized ) {
						d++;
						if( !modules[ y ][ x - 1 ] )
							path += 'M' + x + ',' + y + 'h' + d + 'v1h-' + d + 'v-1z', d = 0;
					} else path += 'M' + x + ',' + y + 'h1v1h-1v-1z';
				}
			}
		}

		r = svg('svg', {

			 'viewBox'		: [ 0, 0, s, s ].join(' ')
			,'width'		:  dm
			,'height'		:  dm
			,'fill'			:  fg
			,'shape-rendering'	: 'crispEdges'
			,'xmlns'		:  ns
			,'version'		: '1.1'
		} );

		if( bg ) r.appendChild( svg( 'path', {

			 'fill'			:  bg
			,'d'			: 'M0,0V' + s + 'H' + s + 'V0H0Z'
		} ) );

		r.appendChild( svg( 'path', {

			 'transform'		: 'matrix(' + mx + ')'
			,'d'			:  path
		} ) );

		return r;
	} )();
}
