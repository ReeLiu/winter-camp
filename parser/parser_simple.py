from nltk.parse.stanford import StanfordDependencyParser

path_to_jar = 'path_to/stanford-parser-full-2014-08-27/stanford-parser.jar'
path_to_models_jar = 'path_to/stanford-parser-full-2014-08-27/stanford-parser-3.4.1-models.jar'

dependency_parser = StanfordDependencyParser(path_to_jar=path_to_jar, path_to_models_jar=path_to_models_jar)

input_sentences = input()
result = dependency_parser.raw_parse(input_sentences)
dep = result.next()

dep = list(dep.triples())


class draw_obj():
    def __init__(self, name, draw_class):
        self.name = name
        self.draw_class = draw_class
        self.y = 0
        self.x = [0, 1]
        self.z = [0, 1]

    def to_dict(self):
        return {
            'name': self.name,
            'class': self.draw_class,
            'y': self.y,
            'x': self.x,
            'z': self.z
        }


draw_objs = {
    'rabbit': ['rabbit'],
    'bicycle': ['bike', 'bicycle'],
    'tree': ['tree'],
    'leaf': ['leaf', 'leaves'],
    'sun': ['sun'],
    'moon': ['moon'],
    'cloud': ['cloud'],
    'flower': ['flower']
}

number_dict = {
    'one': 1, '1': 1,
    'two': 2, '2': 1,
    'three': 3, '3': 1,
    'four': 4, '4': 1,
}

obj_list = []
for idx, rule in enumerate(dep):
    for key, value in draw_objs.iteritems():
        for target in value:
            if rule[0][0].find(target) != -1:
                # num detect
                number = 1
                for i in range(idx + 1, len(dep)):
                    if dep[idx + 1][0] == rule[0] and dep[idx + 1][2][0] == u'NUM':
                        number = number_dict[dep[idx + 1][2][0]]
                        for i in range(number):
                            obj_list.append(draw_obj('obj' + str(i), key))


