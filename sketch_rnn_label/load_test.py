import svgwrite
from six.moves import xrange

from model import *
from sketch_rnn_train import *
from utils import *
import argparse


# download_pretrained_models(models_root_dir=models_root_dir)

def reset_graph():
    """Closes the current default session and resets the graph."""
    sess = tf.get_default_session()
    if sess:
        sess.close()
    tf.reset_default_graph()


def decode(sess, sample_model, eval_model, z_input=None, draw_mode=True, temperature=0.1, factor=0.2, name=None):
    z = None
    if z_input is not None:
        z = [z_input]
    sample_strokes, m = sample(sess, sample_model, seq_len=eval_model.hps.max_seq_len, temperature=temperature, z=z)
    strokes = to_normal_strokes(sample_strokes)
    if draw_mode:
        draw_strokes(strokes, factor, svg_filename=name)
    return strokes


def draw_strokes(data, factor=0.2, svg_filename='./svg/test.svg'):
    tf.gfile.MakeDirs(os.path.dirname(svg_filename))
    min_x, max_x, min_y, max_y = get_bounds(data, factor)
    dims = (50 + max_x - min_x, 50 + max_y - min_y)
    dwg = svgwrite.Drawing(svg_filename, size=dims)
    dwg.add(dwg.rect(insert=(0, 0), size=dims, fill='white'))
    lift_pen = 1
    abs_x = 25 - min_x
    abs_y = 25 - min_y
    p = "M%s,%s " % (abs_x, abs_y)
    command = "m"
    for i in xrange(len(data)):
        if lift_pen == 1:
            command = "m"
        elif command != "l":
            command = "l"
        else:
            command = ""
        x = float(data[i, 0]) / factor
        y = float(data[i, 1]) / factor
        lift_pen = data[i, 2]
        p += command + str(x) + "," + str(y) + " "
    the_color = "black"
    stroke_width = 1
    dwg.add(dwg.path(p).stroke(the_color, stroke_width).fill("none"))
    dwg.save()
    # display(SVG(dwg.tostring()))


def load_model(model_dir):
    """Loads model for inference mode, used in jupyter notebook."""
    model_params = sketch_rnn_model.get_default_hparams()
    with tf.gfile.Open(os.path.join(model_dir, 'model_config.json'), 'r') as f:
        model_params.parse_json(f.read())

    model_params.batch_size = 1  # only sample one at a time
    eval_model_params = sketch_rnn_model.copy_hparams(model_params)
    eval_model_params.use_input_dropout = 0
    eval_model_params.use_recurrent_dropout = 0
    eval_model_params.use_output_dropout = 0
    eval_model_params.is_training = 0
    sample_model_params = sketch_rnn_model.copy_hparams(eval_model_params)
    sample_model_params.max_seq_len = 1  # sample one point at a time
    return [model_params, eval_model_params, sample_model_params]


def encode(stroke, model, sess, label=0):
    feed = {
        model.input_data: stroke,
        model.sequence_lengths: [len(stroke[0])],
        model.input_label_data: [label]
    }

    batch_z = sess.run(model.batch_z, feed_dict=feed)
    return batch_z[0]


def save_txt(stk, filename):
    np.savetxt(filename, stk, fmt='%1.4f')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default='/home/ehaschia/Code/winter-camp')
    parser.add_argument('--models_root_dir', type=str, default='/home/ehaschia/Code/winter-camp/sketch_rnn_label')
    parser.add_argument('--model_dir', type=str, default='/home/ehaschia/Code/winter-camp/sketch_rnn_label/flower_sun')
    parser.add_argument('--condition', action='store_true')
    parser.add_argument('--number', type=int, default=10)
    parser.add_argument('--unpair', action='store_true', help='generate unpair input')
    parser.add_argument('--save_dir', default='./output/')
    args = parser.parse_args()
    print(args)
    condition = args.condition
    data_dir = args.data_dir
    models_root_dir = args.models_root_dir
    model_dir = args.model_dir
    number_sample = args.number
    save_dir = args.save_dir
    if condition:
        [train_set, valid_set, test_set, hps_model, eval_hps_model, sample_hps_model] = load_env(data_dir,
                                                                                                 model_dir)

        reset_graph()
        model = Model(hps_model)
        eval_model = Model(eval_hps_model, reuse=True)
        sample_model = Model(sample_hps_model, reuse=True)

        sess = tf.InteractiveSession()
        sess.run(tf.global_variables_initializer())
        load_checkpoint(sess, model_dir)
        for i in range(number_sample):
            stroke = test_set.random_sample()
            draw_strokes(stroke[0], svg_filename=save_dir + str(i) + 'input.svg')
            stroke[0] = test_set.pad_batch([stroke[0]], hps_model.max_seq_len)

            if args.unpair:
                label_num = len(hps_model.data_set)
                if label_num > 1:
                    new_label = np.random.randint(0, label_num)
                    while new_label == stroke[1]:
                        new_label = np.random.randint(0, label_num)
                    stroke[1] = new_label
                    with open(save_dir + str(i) + '_label.txt', 'w') as f:
                        f.write(hps_model.data_set[new_label])
            z = encode(stroke[0], eval_model, sess, label=stroke[1])

            stk = decode(sess, sample_model, eval_model, z, temperature=0.2, name=save_dir + str(i) + '.svg')
            save_txt(stk, save_dir + str(i) + '.txt')
    else:
        [hps_model, eval_hps_model, sample_hps_model] = load_model(model_dir)
        reset_graph()
        model = Model(hps_model)
        eval_model = Model(eval_hps_model, reuse=True)
        sample_model = Model(sample_hps_model, reuse=True)

        sess = tf.InteractiveSession()
        sess.run(tf.global_variables_initializer())
        load_checkpoint(sess, model_dir)
        for i in range(number_sample):
            z_0 = np.random.randn(eval_hps_model.z_size)
            stk = decode(sess, sample_model, eval_model, z_0, name=save_dir + str(i) + '.svg')
            save_txt(stk, save_dir + str(i) + '.txt')

if __name__ == '__main__':
    main()
