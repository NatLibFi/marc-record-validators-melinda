export const mergeConfig = {
  'mergeConfiguration': {
    'comment #1': 'Meaningless indicators (=indicators having but one legal value) are derived from melindaCustomMergeFields.',
    'comment #2': 'Meaningless indicators and non-filing indicators never prevent merge. (Hard-coded in mergableIndicator.js)',
    'comment #3': 'When merging, indicator preference defaults are defined in mergeIndicators.js. However, these can be overridden here.',
    'indicator1PreferredValues': {
      '022': {'0': 1, '1': 1, ' ': 2},
      '041': {'0': 1, '1': 1, ' ': 2},
      '246': {'0': 1, '1': 1, '2': 1, '3': 1, ' ': 2},
      '341': {'0': 1, '1': 1, ' ': 2},
      '363': {'0': 1, '1': 1, ' ': 2},
      '382': {'0': 1, '1': 1, '2': 1, '3': 1, ' ': 2},
      '384': {'0': 1, '1': 1, ' ': 2},
      '388': {'0': 1, '1': 1, ' ': 2},
      '490': ['1', '0'],
      '505': ['8', '0', '2', '1'],
      '506': {'0': 1, '1': 1, ' ': 2},
      '541': {'0': 1, '1': 1, ' ': 2},
      '542': {'0': 1, '1': 1, ' ': 2},
      '544': {'0': 1, '1': 1, ' ': 2},
      '545': {'0': 1, '1': 1, ' ': 2},
      '561': {'0': 1, '1': 1, ' ': 2},
      '583': {'0': 1, '1': 1, ' ': 2},
      '588': {'0': 1, '1': 1, ' ': 2},
      '650': [' ', '1', '2', '0']
    },
    'indicator2PreferredValues': {
      '024': {'0': 1, '1': 1, ' ': 2},
      '033': {'0': 1, '1': 1, '2': 1, ' ': 2},
      '246': {'0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, ' ': 2},
      '363': {'0': 1, '1': 1, ' ': 2},
      '382': {'0': 1, '1': 1, ' ': 2},
      '730': ['2', ' ']
    },
    'comment #4': 'List indicators that do not block merge here. Non-filing indicators do not prevent field merge (their support is hard-coded). They are mainly listed here as an example.',
    'ignoreIndicator1': ['100', '110', '111', '130', '210', '242', '245', '246', '247', '307', '490', '505', '506', '510', '511', '516', '520', '521', '522', '524', '526', '583', '586', '600', '610', '630', '650', '651', '655', '700', '710', '730', '740', '760', '762', '765', '767', '770', '772', '773', '774', '775', '776', '777', '780', '785', '786', '787', '788', '800', '810'],
    'ignoreIndicator2': ['017', '222', '240', '242', '243', '245', '760', '762', '765', '767', '770', '773', '774', '775', '776', '777', '786', '787', '788', '830'],
    'comment #5': 'If one indicator has value, and the other has not, it does not necessarily mean mismatch',
    'tolerateBlankIndicator1': ['022', '037', '041', '046', '050', '055', '060', '070', '080', '246', '260', '264', '341', '363', '382', '384', '388', '541', '542', '544', '545', '561', '583', '588', '856'],
    'tolerateBlankIndicator2': ['024', '033', '082', '246', '363', '382', '856'],
    'preprocessorDirectives': [
      {
        'operation': 'retag',
        'recordType': 'source',
        'fieldSpecification': {'tag': '100'},
        'comment': 'NB! Retags should check corresponding 880 fields as well.',
        'newTag': '700'
      },
      {
        'operation': 'retag',
        'recordType': 'source',
        'fieldSpecification': {'tag': '110'},
        'newTag': '710'
      },
      {
        'operation': 'retag',
        'recordType': 'source',
        'fieldSpecification': {'tag': '111'},
        'newTag': '711'
      },
      {
        'operation': 'retag',
        'recordType': 'source',
        'fieldSpecification': {'tag': '130'},
        'newTag': '730'
      }
    ]
  }
};
